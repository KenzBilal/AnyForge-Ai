"""
AnyForge-AI — LLM Service (Groq)
==================================
Two capabilities:
  1. extract_any()    — structured JSON extraction from any text
  2. extract_vision() — structured JSON extraction from images

Model: llama-3.3-70b-versatile (text)
       meta-llama/llama-4-scout-17b-16e-instruct (vision)
"""

import json
import os
import base64
import httpx
from typing import Optional, Any, Dict
from groq import Groq
from pydantic import BaseModel, create_model
import instructor


# ── EventSchema (used by email webhook) ───────────────────────────────────────
class EventSchema(BaseModel):
    title: str
    description: str
    category: str
    location: str
    start_date: str
    end_date: str
    max_attendees: int
    is_public: bool
    status: str = "draft"


# ── Config ────────────────────────────────────────────────────────────────────
TEXT_MODEL   = "llama-3.3-70b-versatile"
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

BASE_SYSTEM_PROMPT = """You are AnyForge-AI, a universal structured-data extraction engine.
Your ONLY job is to read the provided content and return a valid JSON object
that exactly matches the target schema the user specifies.

Rules (non-negotiable):
- Every key in the target schema MUST appear in your output.
- Use null for fields you cannot determine — never omit a key.
- Dates must always be ISO 8601 (e.g. 2025-09-15T09:00:00Z).
- If the schema specifies allowed enum values, you must use one of them exactly."""

EVENT_SCHEMA_DESCRIPTION = """{
  "title": "string — event name",
  "description": "string — clean professional summary",
  "category": "enum: Conference | Workshop | Meetup | Hackathon | Social | Religious | Sports | Other",
  "location": "string — full address or TBD",
  "start_date": "ISO 8601 timestamp",
  "end_date": "ISO 8601 timestamp",
  "max_attendees": "integer — default 100 if not stated",
  "is_public": "boolean — default true",
  "status": "always the string: draft"
}"""

def generate_pydantic_model(schema_str: str) -> type[BaseModel]:
    """Attempts to parse target_schema into a strict Pydantic model for Instructor."""
    try:
        s = schema_str.strip()
        if s.startswith("```json"):
            s = s[7:]
        if s.endswith("```"):
            s = s[:-3]
        s = s.strip()
        
        schema_dict = json.loads(s)
        fields = {}
        for key, val in schema_dict.items():
            annotation = Any
            if isinstance(val, str):
                v = val.lower()
                if "int" in v: annotation = int
                elif "float" in v or "number" in v: annotation = float
                elif "bool" in v: annotation = bool
                elif "list" in v or "array" in v: annotation = list
                elif "dict" in v or "object" in v: annotation = dict
                else: annotation = str
            elif isinstance(val, list):
                annotation = list
            elif isinstance(val, dict):
                annotation = dict
            
            # (Type, default_value) -> ... means required
            fields[key] = (annotation, ...)
            
        return create_model('DynamicModel', **fields)
    except Exception:
        # Fallback for plain-text schemas: Just ask for a dict wrapped in extracted_data
        return create_model('DynamicModel', extracted_data=(Dict[str, Any], ...))


def _build_prompt(content: str, target_schema: str, extra_instructions: str = "") -> str:
    prompt = f"TARGET SCHEMA:\n{target_schema}\n\nCONTENT TO EXTRACT FROM:\n{content}"
    if extra_instructions:
        prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{extra_instructions}"
    return prompt


class LLMService:
    def __init__(self):
        self._client: Optional[Groq] = None

    def configure(self):
        """Called once at startup to initialise the Groq client with Instructor."""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        base_client = Groq(api_key=api_key)
        self._client = instructor.from_groq(base_client, mode=instructor.Mode.JSON)

    @property
    def client(self) -> Groq:
        if not self._client:
            self.configure()
        return self._client

    async def extract_any(
        self,
        prompt: str,
        target_schema: str,
        extra_instructions: str = "",
    ) -> Optional[dict]:
        try:
            full_prompt = _build_prompt(prompt, target_schema, extra_instructions)
            model_cls = generate_pydantic_model(target_schema)

            response = self.client.chat.completions.create(
                model=TEXT_MODEL,
                response_model=model_cls,
                max_retries=3,
                messages=[
                    {"role": "system", "content": BASE_SYSTEM_PROMPT},
                    {"role": "user",   "content": full_prompt},
                ],
                temperature=0.1,
            )
            data = response.model_dump()
            
            # If we fell back to the wrapper, unwrap it
            if "extracted_data" in data and len(data) == 1:
                return data["extracted_data"]
            return data
        except Exception as e:
            print(f"[LLMService.extract_any] Error: {e}")
            return None

    async def extract_large_document(self, prompt: str, target_schema: str) -> dict:
        """Splits massive text into chunks, extracts concurrently, and merges results."""
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        import asyncio
        import copy

        # Groq llama-3.3-70b supports ~8k to 128k depending on endpoint.
        # We'll chunk at 15000 chars safely.
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=15000,
            chunk_overlap=1000,
        )
        chunks = text_splitter.split_text(prompt)
        
        if len(chunks) <= 1:
            res = await self.extract_any(prompt, target_schema)
            return res or {}
            
        tasks = []
        for i, chunk in enumerate(chunks):
            # Instruct the LLM that this is a partial chunk
            extra = f"This is chunk {i+1} of {len(chunks)}. Extract all relevant data matching the schema from this portion only."
            tasks.append(self.extract_any(chunk, target_schema, extra_instructions=extra))
            
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        merged_result = {"_meta": {"total_chunks": len(chunks), "status": "merged"}, "extracted_data": []}
        for chunk_res in results:
            if isinstance(chunk_res, Exception) or chunk_res is None:
                continue
            merged_result["extracted_data"].append(chunk_res)
            
        return merged_result

    async def extract_vision(
        self,
        target_schema: str,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        image_mime_type: str = "image/jpeg",
        extra_instructions: str = "",
    ) -> Optional[dict]:
        if not image_base64 and not image_url:
            raise ValueError("Provide either image_base64 or image_url")
        try:
            if image_url and not image_base64:
                async with httpx.AsyncClient(timeout=15) as http:
                    resp = await http.get(image_url)
                    resp.raise_for_status()
                    image_base64 = base64.b64encode(resp.content).decode("utf-8")
                    ct = resp.headers.get("content-type", "")
                    if ct.startswith("image/"):
                        image_mime_type = ct.split(";")[0].strip()

            if image_base64 and "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]

            text_part = _build_prompt(
                "[See the attached image — extract all relevant information from it]",
                target_schema,
                extra_instructions,
            )

            # NOTE: Instructor might have limited support for multimodel inputs depending on version, 
            # but standard chatting structure usually works if the underlying API supports it.
            model_cls = generate_pydantic_model(target_schema)

            response = self.client.chat.completions.create(
                model=VISION_MODEL,
                response_model=model_cls,
                max_retries=3,
                messages=[
                    {"role": "system", "content": BASE_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": text_part},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{image_mime_type};base64,{image_base64}"
                                },
                            },
                        ],
                    },
                ],
                temperature=0.1,
            )
            data = response.model_dump()
            if "extracted_data" in data and len(data) == 1:
                return data["extracted_data"]
            return data
        except Exception as e:
            print(f"[LLMService.extract_vision] Error: {e}")
            return None

    async def extract_event(self, text: str) -> Optional[EventSchema]:
        try:
            # For specific types like EventSchema we can use response_model natively
            response = self.client.chat.completions.create(
                model=TEXT_MODEL,
                response_model=EventSchema,
                max_retries=3,
                messages=[
                    {"role": "system", "content": BASE_SYSTEM_PROMPT},
                    {"role": "user", "content": _build_prompt(text, EVENT_SCHEMA_DESCRIPTION, 'The "status" field must always be the string "draft".')},
                ],
                temperature=0.1,
            )
            return response
        except Exception as e:
            print(f"[LLMService.extract_event] Schema validation error: {e}")
            return None


# Singleton
llm_service = LLMService()