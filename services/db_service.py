"""
AnyForge-AI — Database Service v2
===================================
- API key validation
- Rate limiting (per-minute + daily)
- Extraction logging
- Usage stats
- API key management (create/list/toggle)
"""

import os
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from supabase import create_client, Client


class DBService:
    def __init__(self, client: Client):
        self.client = client

    @classmethod
    def create(cls) -> "DBService":
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        return cls(create_client(url, key))

    # ─── API Key Validation ───────────────────────────────────────────────────

    def validate_api_key(self, api_key: str) -> Optional[dict]:
        try:
            # Note: store_logs might not exist in an older schema, so we default to True
            # if it's not present, we can just select * or specific fields.
            result = (
                self.client.table("clients")
                .select("id, project_name, rate_limit_per_min, daily_limit, store_logs")
                .eq("api_key", api_key)
                .eq("is_active", True)
                .single()
                .execute()
            )
            data = result.data or None
            # Default store_logs to True if the column doesn't exist or is null
            if data and data.get("store_logs") is None:
                data["store_logs"] = True
            return data
        except Exception as e:
            print(f"[DBService] API key validation error: {e}")
            return None

    # ─── Rate Limiting ────────────────────────────────────────────────────────

    def check_rate_limit(self, client_id: str, limit_per_min: int, daily_limit: int) -> dict:
        """
        Returns {"allowed": bool, "reason": str, "requests_this_minute": int, "requests_today": int}
        """
        try:
            now = datetime.now(timezone.utc)
            # Current 1-minute window (truncated to minute)
            window = now.replace(second=0, microsecond=0)
            window_str = window.isoformat()

            # Upsert rate limit log for this window
            self.client.table("rate_limit_log").upsert(
                {"client_id": client_id, "window_start": window_str, "request_count": 1},
                on_conflict="client_id,window_start",
                ignore_duplicates=False,
            ).execute()

            # Increment count
            self.client.rpc("increment_rate_limit", {
                "p_client_id": client_id,
                "p_window_start": window_str,
            }).execute()

            # Get current minute count
            minute_result = (
                self.client.table("rate_limit_log")
                .select("request_count")
                .eq("client_id", client_id)
                .eq("window_start", window_str)
                .single()
                .execute()
            )
            requests_this_minute = minute_result.data["request_count"] if minute_result.data else 1

            # Get today's count from extraction_logs
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            today_result = (
                self.client.table("extraction_logs")
                .select("id", count="exact")
                .eq("client_id", client_id)
                .gte("created_at", today_start)
                .execute()
            )
            requests_today = today_result.count or 0

            if requests_this_minute > limit_per_min:
                return {
                    "allowed": False,
                    "reason": f"Rate limit exceeded: {limit_per_min} requests/minute allowed",
                    "requests_this_minute": requests_this_minute,
                    "requests_today": requests_today,
                }

            if requests_today >= daily_limit:
                return {
                    "allowed": False,
                    "reason": f"Daily limit exceeded: {daily_limit} requests/day allowed",
                    "requests_this_minute": requests_this_minute,
                    "requests_today": requests_today,
                }

            return {
                "allowed": True,
                "reason": "ok",
                "requests_this_minute": requests_this_minute,
                "requests_today": requests_today,
            }

        except Exception as e:
            print(f"[DBService] Rate limit check error: {e}")
            # Fail open — don't block request if rate limit check itself fails
            return {"allowed": True, "reason": "rate_limit_check_failed", "requests_this_minute": 0, "requests_today": 0}

    # ─── Extraction Logging ───────────────────────────────────────────────────

    def log_extraction(
        self,
        client: dict,
        endpoint_used: str,
        target_schema: str,
        input_snippet: str,
        output_json: Optional[dict],
        grounding_used: bool,
        success: bool,
        error_message: Optional[str] = None,
    ) -> None:
        try:
            # Enterprise Zero-Retention checks
            if not client.get("store_logs", True):
                # We skip storing input snippet and output json if zero-retention is requested
                # We still log the request metadata purely for billing/rate limits.
                input_snippet = "<redacted by zero-retention policy>"
                output_json = {"_redacted": "zero-retention policy enabled"}

            self.client.table("extraction_logs").insert({
                "client_id":      client["id"],
                "endpoint_used":  endpoint_used,
                "target_schema":  target_schema[:2000],
                "input_snippet":  (input_snippet or "")[:500],
                "output_json":    output_json,
                "grounding_used": grounding_used,
                "success":        success,
                "error_message":  error_message,
            }).execute()
        except Exception as e:
            print(f"[DBService] Failed to write extraction log: {e}")

    # ─── Usage Stats ──────────────────────────────────────────────────────────

    def get_usage_summary(self) -> list:
        try:
            result = (
                self.client.table("client_usage_summary")
                .select("*")
                .order("total_extractions", desc=True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"[DBService] Usage summary error: {e}")
            return []

    def get_client_usage(self, client_id: str) -> Optional[dict]:
        try:
            result = (
                self.client.table("client_usage_summary")
                .select("*")
                .eq("id", client_id)
                .single()
                .execute()
            )
            return result.data or None
        except Exception as e:
            print(f"[DBService] Client usage error: {e}")
            return None

    # ─── API Key Management ───────────────────────────────────────────────────

    def list_clients(self) -> list:
        try:
            result = (
                self.client.table("client_usage_summary")
                .select("id, project_name, api_key, is_active, rate_limit_per_min, daily_limit, created_at, total_extractions, extractions_today, last_used_at")
                .order("created_at", desc=True)
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"[DBService] List clients error: {e}")
            return []

    def create_client(self, project_name: str, rate_limit_per_min: int = 20, daily_limit: int = 500) -> Optional[dict]:
        try:
            api_key = f"af-{secrets.token_urlsafe(24)}"
            result = (
                self.client.table("clients")
                .insert({
                    "project_name": project_name,
                    "api_key": api_key,
                    "is_active": True,
                    "rate_limit_per_min": rate_limit_per_min,
                    "daily_limit": daily_limit,
                })
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"[DBService] Create client error: {e}")
            return None

    def toggle_client(self, client_id: str, is_active: bool) -> bool:
        try:
            self.client.table("clients").update({"is_active": is_active}).eq("id", client_id).execute()
            return True
        except Exception as e:
            print(f"[DBService] Toggle client error: {e}")
            return False

    def rotate_client_key(self, client_id: str) -> Optional[str]:
        try:
            new_api_key = f"af-{secrets.token_urlsafe(24)}"
            result = (
                self.client.table("clients")
                .update({"api_key": new_api_key})
                .eq("id", client_id)
                .execute()
            )
            if result.data:
                return new_api_key
            return None
        except Exception as e:
            print(f"[DBService] Rotate key error: {e}")
            return None

    def delete_client(self, client_id: str) -> bool:
        try:
            self.client.table("clients").delete().eq("id", client_id).execute()
            return True
        except Exception as e:
            print(f"[DBService] Delete client error: {e}")
            return False


db_service: Optional[DBService] = None