"""
AnyForge-AI — Database Service
================================
Universal multi-tenant DB operations.
Uses sync Supabase client (works with all supabase versions).
"""

import os
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
        client: Client = create_client(url, key)
        return cls(client)

    def validate_api_key(self, api_key: str) -> Optional[dict]:
        try:
            result = (
                self.client.table("clients")
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

    def log_extraction(
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
            self.client.table("extraction_logs").insert({
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