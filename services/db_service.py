"""
AnyForge-AI — Database Service
================================
Async Supabase client wrapper.
Handles client authentication and extraction audit logging.

Improvements over v1:
  - Structured logging (no raw print statements)
  - input_snippet truncation moved here (not in caller)
  - log_extraction never raises — failures are silently logged
  - Defensive None checks on result.data
"""

import os
import logging
from typing import Optional

from supabase import AsyncClient, acreate_client

logger = logging.getLogger("anyforge.db")


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
        """Async factory — call once inside FastAPI's lifespan hook."""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
            )
        client: AsyncClient = await acreate_client(url, key)
        logger.info("Supabase async client created for: %s", url)
        return cls(client)

    # ── Authentication ─────────────────────────────────────────────────────────

    async def validate_api_key(self, api_key: str) -> Optional[dict]:
        """
        Validates an API key against the clients table.
        Returns the client row (id, project_name) if valid and active.
        Returns None if the key doesn't exist, is inactive, or DB errors.
        """
        if not api_key or not api_key.strip():
            return None
        try:
            result = (
                await self.client.table("clients")
                .select("id, project_name")
                .eq("api_key", api_key.strip())
                .eq("is_active", True)
                .single()
                .execute()
            )
            return result.data or None
        except Exception as e:
            logger.error("API key validation error: %s", e)
            return None

    # ── Audit Logging ──────────────────────────────────────────────────────────

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
        Called fire-and-forget — never raises, never blocks the response.
        """
        try:
            await self.client.table("extraction_logs").insert({
                "client_id":      client_id,
                "endpoint_used":  endpoint_used,
                "target_schema":  (target_schema or "")[:2000],
                "input_snippet":  (input_snippet or "")[:500],
                "output_json":    output_json,
                "grounding_used": grounding_used,
                "success":        success,
                "error_message":  (error_message or "")[:500] if error_message else None,
            }).execute()
        except Exception as e:
            # Logging must NEVER crash the main request
            logger.error("Failed to write extraction log: %s", e)