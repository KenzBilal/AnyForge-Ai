"""
AnyForge-AI — Core LLM Service
================================
Three capabilities:

  1. extract_any()    — Dynamic schema extraction from any text
  2. extract_vision() — Multi-modal extraction from images (base64 or URL)
  3. extract_event()  — Legacy wrapper for backwards-compat with webhooks

Improvements over v1:
  - Lazy initialisation — no crash at import time if GEMINI_API_KEY is missing
  - configure() called explicitly during app lifespan (startup)
  - Retry logic (up to 3 attempts) with exponential back-off
  - Structured logging throughout
  - Safer base64 / URL handling
  - Grounding limitation documented and handled cleanly
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

# ── Model config ───────────────────────────────────────────────────────────────
MODEL_NAME    = "gemini-2.0-flash"
MAX_RETRIES   = 3
RETRY_DELAY_S = 1.5   # seconds; doubled each retry


# ── Backwards-compat schema (used by webhooks.py) ─────────────────────────────
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


# ── Prompts ────────────────────────────────────────────────────────────────────
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


# ── Helpers ────────────────────────────────────────────────────────────────────
def _strip_fences(text: str) -> str:
    """Remove accidental markdown code fences from model output."""
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


# ── Service ────────────────────────────────────────────────────────────────────
class LLMService:
    """
    Lazy-initialised Gemini service.
    Call configure() once at app startup (inside the lifespan hook).
    """

    _configured: bool = False

    def configure(self) -> None:
        """Explicitly configure the Gemini client. Safe to call multiple times."""
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
        tools = []
        if use_grounding:
            tools.append(genai.protos.Tool(
                google_search=genai.protos.GoogleSearch()
            ))
        return genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=BASE_SYSTEM_PROMPT,
            tools=tools if tools else None,
        )

    def _generation_config(self, use_grounding: bool) -> genai.types.GenerationConfig:
        """
        Note: response_mime_type="application/json" is incompatible with grounding tools.
        When grounding is on we rely on the system prompt + manual JSON parsing.
        """
        if use_grounding:
            return genai.types.GenerationConfig(temperature=0.1)
        return genai.types.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
        )

    async def _generate_with_retry(
        self,
        model: genai.GenerativeModel,
        content,
        generation_config: genai.types.GenerationConfig,
        context: str = "extract",
    ) -> Optional[str]:
        """Call generate_content_async with exponential-backoff retry."""
        delay = RETRY_DELAY_S
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await model.generate_content_async(
                    content,
                    generation_config=generation_config,
                )
                return response.text
            except Exception as e:
                logger.warning(
                    "[%s] Gemini attempt %d/%d failed: %s",
                    context, attempt, MAX_RETRIES, e,
                )
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(delay)
                    delay *= 2
        return None

    # ── Public API ─────────────────────────────────────────────────────────────

    async def extract_any(
        self,
        prompt: str,
        target_schema: str,
        extra_instructions: str = "",
        use_grounding: bool = False,
    ) -> Optional[dict]:
        """
        Dynamic schema extraction from any text.
        Returns a dict matching target_schema, or None on failure.
        """
        model  = self._get_model(use_grounding)
        config = self._generation_config(use_grounding)
        full_prompt = _build_prompt(prompt, target_schema, extra_instructions)

        raw = await self._generate_with_retry(model, full_prompt, config, "extract_any")
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
        """
        Multi-modal image extraction — receipts, flyers, handwritten notes, etc.
        Supply EITHER image_base64 OR image_url.
        Returns a dict matching target_schema, or None on failure.
        """
        if not image_base64 and not image_url:
            raise ValueError("Provide either image_base64 or image_url.")

        # Download image from URL if needed
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

        # Strip data-URI prefix if present (e.g. "data:image/png;base64,...")
        if image_base64 and "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        model  = self._get_model(use_grounding)
        config = self._generation_config(use_grounding)

        text_part  = _build_prompt(
            "[See the attached image — extract all relevant information from it]",
            target_schema,
            extra_instructions,
        )
        image_part = {"mime_type": image_mime_type, "data": image_base64}

        raw = await self._generate_with_retry(
            model, [text_part, image_part], config, "extract_vision"
        )
        if raw is None:
            return None

        try:
            return json.loads(_strip_fences(raw))
        except json.JSONDecodeError as e:
            logger.error("[extract_vision] JSON parse error: %s | raw: %.300s", e, raw)
            return None

    # ── Legacy wrapper ─────────────────────────────────────────────────────────
    async def extract_event(self, text: str) -> Optional[EventSchema]:
        """Used by webhooks.py — delegates to extract_any with the EventSchema."""
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


# Module-level singleton — lazy, safe to import before configure() is called
llm_service = LLMService()