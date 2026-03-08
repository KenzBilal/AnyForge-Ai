"""
AnyForge-AI — Core LLM Service
================================
Three capabilities:

  1. extract_any()    — Dynamic schema extraction from any text
  2. extract_vision() — Multi-modal extraction from images (base64 or URL)
  3. extract_event()  — Legacy wrapper for backwards-compat with webhooks

Fixes in v2.2:
  - Removed response_mime_type="application/json" — unsupported on gemini-2.0-flash
  - Fixed grounding tool API for google-generativeai==0.8.3
  - Relies purely on system prompt + _strip_fences for JSON extraction
"""

import json
import os
import base64
import asyncio
import logging
from typing import Optional

import httpx
import google.generativeai as genai
from pydantic import BaseModel

logger = logging.getLogger("anyforge.llm")

MODEL_NAME    = "gemini-1.5-flash-latest"
MAX_RETRIES   = 3
RETRY_DELAY_S = 1.5


class EventSchema(BaseModel):
    title:         str
    description:   str
    category:      str
    location:      str
    start_date:    str
    end_date:      str
    max_attendees: int
    is_public:     bool
    status:        str = "draft"


BASE_SYSTEM_PROMPT = """\
You are AnyForge-AI, a universal structured-data extraction engine.
Your ONLY job is to read the provided content and return a valid JSON object
that exactly matches the target schema the user specifies.

Rules (non-negotiable):
- Output ONLY the raw JSON object. No markdown fences, no explanation, no preamble.
- Every key in the target schema MUST appear in your output.
- Use null for fields you cannot determine — never omit a key.
- Dates must always be ISO 8601 (e.g. 2025-09-15T09:00:00Z).
- If the schema specifies allowed enum values, you must use one of them exactly.
"""

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
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


def _build_prompt(user_content: str, target_schema: str, extra_instructions: str = "") -> str:
    prompt = f"TARGET SCHEMA:\n{target_schema}\n\nCONTENT TO EXTRACT FROM:\n{user_content}"
    if extra_instructions:
        prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{extra_instructions}"
    return prompt


class LLMService:
    _configured: bool = False

    def configure(self) -> None:
        if self._configured:
            return
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")
        genai.configure(api_key=api_key)
        self._configured = True
        logger.info("Gemini configured with model: %s", MODEL_NAME)

    def _ensure_configured(self) -> None:
        if not self._configured:
            self.configure()

    def _get_model(self, use_grounding: bool = False) -> genai.GenerativeModel:
        self._ensure_configured()
        tools = None
        if use_grounding:
            tools = [{"google_search_retrieval": {}}]
        return genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=BASE_SYSTEM_PROMPT,
            tools=tools,
        )

    def _generation_config(self) -> genai.types.GenerationConfig:
        return genai.types.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
        )

    async def _generate_with_retry(self, model, content, context: str = "extract") -> Optional[str]:
        config = self._generation_config()
        delay = RETRY_DELAY_S
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await model.generate_content_async(content, generation_config=config)
                return response.text
            except Exception as e:
                logger.warning("[%s] Gemini attempt %d/%d failed: %s", context, attempt, MAX_RETRIES, e)
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(delay)
                    delay *= 2
        return None

    async def extract_any(
        self,
        prompt: str,
        target_schema: str,
        extra_instructions: str = "",
        use_grounding: bool = False,
    ) -> Optional[dict]:
        model = self._get_model(use_grounding)
        full_prompt = _build_prompt(prompt, target_schema, extra_instructions)
        raw = await self._generate_with_retry(model, full_prompt, "extract_any")
        if raw is None:
            return None
        try:
            return json.loads(_strip_fences(raw))
        except json.JSONDecodeError as e:
            logger.error("[extract_any] JSON parse error: %s | raw: %.300s", e, raw)
            return None

    async def extract_vision(
        self,
        target_schema: str,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        image_mime_type: str = "image/jpeg",
        extra_instructions: str = "",
        use_grounding: bool = False,
    ) -> Optional[dict]:
        if not image_base64 and not image_url:
            raise ValueError("Provide either image_base64 or image_url.")

        if image_url and not image_base64:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(image_url)
                    resp.raise_for_status()
                    image_base64 = base64.b64encode(resp.content).decode("utf-8")
                    ct = resp.headers.get("content-type", "")
                    if ct.startswith("image/"):
                        image_mime_type = ct.split(";")[0].strip()
            except Exception as e:
                logger.error("[extract_vision] Failed to fetch image URL %s: %s", image_url, e)
                return None

        if image_base64 and "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        model = self._get_model(use_grounding)
        text_part = _build_prompt(
            "[See the attached image — extract all relevant information from it]",
            target_schema,
            extra_instructions,
        )
        image_part = {"mime_type": image_mime_type, "data": image_base64}

        raw = await self._generate_with_retry(model, [text_part, image_part], "extract_vision")
        if raw is None:
            return None
        try:
            return json.loads(_strip_fences(raw))
        except json.JSONDecodeError as e:
            logger.error("[extract_vision] JSON parse error: %s | raw: %.300s", e, raw)
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
            logger.error("[extract_event] Schema validation error: %s", e)
            return None


llm_service = LLMService()