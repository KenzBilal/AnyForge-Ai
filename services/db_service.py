"""
AnyForge-AI — Database Service
================================
Async Supabase client wrapper — compatible with supabase>=2.9.x
"""

import os
import logging
from typing import Optional

from supabase._async.client import AsyncClient, create_client as acreate_client

logger = logging.getLogger("anyforge.db")


class DBService:
    def __init__(self, client: AsyncClient):
        self.client = client

    @classmethod
    async def create(cls) -> "DBService":
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        client: AsyncClient = await acreate_client(url, key)  # type: ignore
        logger.info("Supabase async client created for: %s", url)
        return cls(client)

    async def validate_api_key(self, api_key: str) -> Optional[dict]:
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
            logger.error("Failed to write extraction log: %s", e)