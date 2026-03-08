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
from typing import Optional
from groq import Groq
from pydantic import BaseModel


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
- Output ONLY the raw JSON object. No markdown fences, no explanation, no preamble.
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


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def _build_prompt(content: str, target_schema: str, extra_instructions: str = "") -> str:
    prompt = f"TARGET SCHEMA:\n{target_schema}\n\nCONTENT TO EXTRACT FROM:\n{content}"
    if extra_instructions:
        prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{extra_instructions}"
    return prompt


class LLMService:
    def __init__(self):
        self._client: Optional[Groq] = None

    def configure(self):
        """Called once at startup to initialise the Groq client."""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        self._client = Groq(api_key=api_key)

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
            response = self.client.chat.completions.create(
                model=TEXT_MODEL,
                messages=[
                    {"role": "system", "content": BASE_SYSTEM_PROMPT},
                    {"role": "user",   "content": full_prompt},
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            raw = _strip_fences(response.choices[0].message.content)
            return json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"[LLMService.extract_any] JSON parse error: {e}")
            return None
        except Exception as e:
            print(f"[LLMService.extract_any] Error: {e}")
            return None

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

            response = self.client.chat.completions.create(
                model=VISION_MODEL,
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
            raw = _strip_fences(response.choices[0].message.content)
            return json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"[LLMService.extract_vision] JSON parse error: {e}")
            return None
        except Exception as e:
            print(f"[LLMService.extract_vision] Error: {e}")
            return None

    async def extract_event(self, text: str) -> Optional[EventSchema]:
        data = await self.extract_any(
            prompt=text,
            target_schema=EVENT_SCHEMA_DESCRIPTION,
            extra_instructions='The "status" field must always be the string "draft".',
        )
        if not data:
            return None
        try:
            return EventSchema(**data)
        except Exception as e:
            print(f"[LLMService.extract_event] Schema validation error: {e}")
            return None


# Singleton
llm_service = LLMService()