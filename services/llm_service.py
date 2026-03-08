"""
AnyForge-AI — Core LLM Service
================================
Three capabilities in one service:

  1. extract_any()    — Dynamic schema extraction from any text prompt
  2. extract_vision() — Multi-modal extraction from base64 images or public URLs
  3. Both support web_grounding=True to let Gemini search the internet first

Model: gemini-2.0-flash (fast, cheap, vision-capable, grounding-capable)
"""

import json
import os
import base64
import httpx
from typing import Optional
import google.generativeai as genai
from pydantic import BaseModel


# ─── Kept for backwards-compat with webhooks.py (email → EventSchema path) ───
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


# ─── Shared config ─────────────────────────────────────────────────────────────
MODEL_NAME = "gemini-2.0-flash"

BASE_SYSTEM_PROMPT = """
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
    """Remove accidental markdown code fences from model output."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def _build_prompt(user_content: str, target_schema: str, extra_instructions: str = "") -> str:
    prompt = f"""TARGET SCHEMA:
{target_schema}

CONTENT TO EXTRACT FROM:
{user_content}"""
    if extra_instructions:
        prompt += f"\n\nADDITIONAL INSTRUCTIONS:\n{extra_instructions}"
    return prompt


class LLMService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        genai.configure(api_key=api_key)

    def _get_model(self, use_grounding: bool = False) -> genai.GenerativeModel:
        """
        Returns a configured GenerativeModel.
        When use_grounding=True, attaches the GoogleSearch tool so Gemini can
        silently fetch live data before generating the JSON.
        """
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
        Note: response_mime_type="application/json" cannot be combined with
        grounding tools — Gemini rejects that combination. When grounding is on,
        we rely on the system prompt + manual JSON parsing instead.
        """
        if use_grounding:
            return genai.types.GenerationConfig(temperature=0.1)
        return genai.types.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
        )

    async def extract_any(
        self,
        prompt: str,
        target_schema: str,
        extra_instructions: str = "",
        use_grounding: bool = False,
    ) -> Optional[dict]:
        """
        UPGRADE 1 — Dynamic Schema Extraction
        ----------------------------------------
        Extracts structured data from any text prompt against any schema you
        describe in plain English / JSON.

        Args:
            prompt:             Raw text to extract from.
            target_schema:      Plain-text description of the desired output
                                fields (names, types, constraints).
            extra_instructions: Optional extra rules for this specific call.
            use_grounding:      If True, Gemini searches the web before answering.

        Returns:
            A plain dict matching the target_schema, or None on failure.
        """
        try:
            model = self._get_model(use_grounding)
            full_prompt = _build_prompt(prompt, target_schema, extra_instructions)

            response = await model.generate_content_async(
                full_prompt,
                generation_config=self._generation_config(use_grounding),
            )

            raw = _strip_fences(response.text)
            return json.loads(raw)

        except json.JSONDecodeError as e:
            print(f"[LLMService.extract_any] JSON parse error: {e}")
            print(f"[LLMService.extract_any] Raw: {response.text[:300]}")
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
        use_grounding: bool = False,
    ) -> Optional[dict]:
        """
        UPGRADE 2 — Multi-Modal Vision Extraction
        -------------------------------------------
        Reads an image (handwritten note, receipt, PDF screenshot, event flyer,
        whiteboard photo, etc.) and extracts structured data from it.

        Supply EITHER image_base64 OR image_url — not both.

        Args:
            target_schema:      Plain-text description of the desired output fields.
            image_base64:       Raw base64-encoded image bytes (no data-URI prefix needed).
            image_url:          Publicly accessible image URL (fetched server-side).
            image_mime_type:    MIME type of the image (default: image/jpeg).
            extra_instructions: Optional extra rules.
            use_grounding:      If True, Gemini can search the web before answering.

        Returns:
            A plain dict matching the target_schema, or None on failure.
        """
        if not image_base64 and not image_url:
            raise ValueError("Provide either image_base64 or image_url")

        try:
            # If a URL was given, download bytes and base64-encode them
            if image_url and not image_base64:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(image_url)
                    resp.raise_for_status()
                    image_base64 = base64.b64encode(resp.content).decode("utf-8")
                    ct = resp.headers.get("content-type", "")
                    if ct.startswith("image/"):
                        image_mime_type = ct.split(";")[0].strip()

            # Strip data-URI prefix if caller included it (e.g. "data:image/png;base64,...")
            if image_base64 and "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]

            model = self._get_model(use_grounding)

            text_part = _build_prompt(
                "[See the attached image — extract all relevant information from it]",
                target_schema,
                extra_instructions,
            )

            image_part = {"mime_type": image_mime_type, "data": image_base64}

            response = await model.generate_content_async(
                [text_part, image_part],
                generation_config=self._generation_config(use_grounding),
            )

            raw = _strip_fences(response.text)
            return json.loads(raw)

        except json.JSONDecodeError as e:
            print(f"[LLMService.extract_vision] JSON parse error: {e}")
            print(f"[LLMService.extract_vision] Raw: {response.text[:300]}")
            return None
        except Exception as e:
            print(f"[LLMService.extract_vision] Error: {e}")
            return None

    # ── Backwards-compatible wrapper used by webhooks.py ──────────────────────
    async def extract_event(self, text: str) -> Optional[EventSchema]:
        """
        Legacy entry point — used by the email webhook to extract EventSchema.
        Delegates to extract_any() with the fixed event schema description.
        """
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


# Singleton — import this everywhere
llm_service = LLMService()
