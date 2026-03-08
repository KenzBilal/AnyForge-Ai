"""
AnyForge-AI — Database Service
================================
Universal multi-tenant DB operations.
Client authentication and extraction logging only.
"""

import os
from typing import Optional
from supabase import AsyncClient, acreate_client


class DBService:
    def __init__(self, client: AsyncClient):
        self.client = client

    @classmethod
    async def create(cls) -> "DBService":
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        client: AsyncClient = await acreate_client(url, key)
        return cls(client)

    async def validate_api_key(self, api_key: str) -> Optional[dict]:
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
                "target_schema":  target_schema[:2000],
                "input_snippet":  (input_snippet or "")[:500],
                "output_json":    output_json,
                "grounding_used": grounding_used,
                "success":        success,
                "error_message":  error_message,
            }).execute()
        except Exception as e:
            print(f"[DBService] Failed to write extraction log: {e}")


db_service: Optional[DBService] = None