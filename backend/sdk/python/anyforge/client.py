import httpx
from typing import Any, Dict, Optional

class AnyForgeClient:
    """Official Python SDK for AnyForge-AI."""
    
    def __init__(self, api_key: str, base_url: str = "https://anyforge-ai-production.up.railway.app"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(headers={"x-api-key": self.api_key}, timeout=60.0)

    def generate(self, prompt: str, target_schema: str, grounding: bool = False) -> Dict[str, Any]:
        """Extract structured JSON from text."""
        url = f"{self.base_url}/api/v1/generate"
        payload = {
            "prompt": prompt,
            "target_schema": target_schema,
            "grounding": grounding
        }
        resp = self.client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()["result"]

    def extract_vision(self, image_base64: str, target_schema: str, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """Extract structured JSON from an image."""
        url = f"{self.base_url}/api/v1/extract-vision"
        payload = {
            "image_base64": image_base64,
            "mime_type": mime_type,
            "target_schema": target_schema
        }
        resp = self.client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()["result"]

    def generate_async(self, prompt: str, target_schema: str, webhook_url: Optional[str] = None) -> Dict[str, str]:
        """Submit a massive document for asynchronous chunking extraction."""
        url = f"{self.base_url}/api/v1/generate/async"
        payload = {
            "prompt": prompt,
            "target_schema": target_schema,
            "webhook_url": webhook_url
        }
        resp = self.client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Check the status of an async extraction job."""
        url = f"{self.base_url}/api/v1/jobs/{job_id}"
        resp = self.client.get(url)
        resp.raise_for_status()
        return resp.json()
