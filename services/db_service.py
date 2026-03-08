"""
AnyForge-AI — Database Service
================================
Universal multi-tenant DB operations.
No business logic from any specific project lives here —
only client authentication and extraction logging.
"""

import os
from typing import Optional
from supabase import AsyncClient, acreate_client


class DBService:
    """
    Async Supabase client wrapper.
    Initialised once at startup via the async factory `create()`.
    Stored on app.state.db by the lifespan hook in main.py.
    """

    def __init__(self, client: AsyncClient):
        self.client = client

    @classmethod
    async def create(cls) -> "DBService":
        """Async factory — await this once inside FastAPI's lifespan hook."""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Bypasses RLS — never expose publicly
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        client: AsyncClient = await acreate_client(url, key)
        return cls(client)

    # ── Authentication ────────────────────────────────────────────────────────

    async def validate_api_key(self, api_key: str) -> Optional[dict]:
        """
        Validates an API key against the clients table.
        Returns the client row (id, project_name) if the key is valid and active.
        Returns None if the key doesn't exist or is_active = false.
        """
        try:
            result = (
                await self.client.table("clients")
                .select("id, project_name")
                .eq("api_key", api_key)
                .eq("is_active", True)
                .single()
                .execute()
            )
            return result.data or None
        except Exception as e:
            print(f"[DBService] API key validation error: {e}")
            return None

    # ── Audit Logging ─────────────────────────────────────────────────────────

    async def log_extraction(
        self,
        client_id: str,
        endpoint_used: str,
        target_schema: str,
        input_snippet: str,
        output_json: Optional[dict],
        grounding_used: bool,
        success: bool,
        error_message: Optional[str] = None,
    ) -> None:
        """
        Writes one row to extraction_logs.
        Called fire-and-forget after every Gemini response —
        failures here are logged but never surface to the API caller.
        """
        try:
            await self.client.table("extraction_logs").insert({
                "client_id":      client_id,
                "endpoint_used":  endpoint_used,
                "target_schema":  target_schema[:2000],          # cap schema length
                "input_snippet":  (input_snippet or "")[:500],   # first 500 chars only
                "output_json":    output_json,
                "grounding_used": grounding_used,
                "success":        success,
                "error_message":  error_message,
            }).execute()
        except Exception as e:
            # Logging must never crash the main request
            print(f"[DBService] Failed to write extraction log: {e}")


# Module-level reference — populated by lifespan() in main.py
db_service: Optional[DBService] = None
