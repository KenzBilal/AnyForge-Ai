"""
AnyForge-AI — Generator Router
================================
POST /api/v1/generate        — dynamic schema extraction from any text
POST /api/v1/extract-vision  — multi-modal extraction from images

Both endpoints:
  - Authenticate via X-API-Key header (validated against clients table)
  - Fire-and-forget audit log after every extraction
  - Support use_grounding=true for live web search before extraction

Improvements over v1:
  - Structured logging (no raw print statements)
  - Input length validation to prevent abuse
  - Consistent error response shape: {status, detail}
  - Cleaner fire-and-forget pattern with exception guard
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from services.llm_service import llm_service

logger = logging.getLogger("anyforge.generator")
router = APIRouter()

# ── Constants ──────────────────────────────────────────────────────────────────
MAX_PROMPT_LEN  = 20_000   # characters
MAX_SCHEMA_LEN  = 5_000
MAX_EXTRA_LEN   = 2_000


# ── Shared auth helper ─────────────────────────────────────────────────────────

async def _get_client(request: Request, x_api_key: str) -> dict:
    """Validates X-API-Key header and returns the client row, or raises 401."""
    db = request.app.state.db
    client = await db.validate_api_key(x_api_key)
    if not client:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key.")
    return client


def _fire_log(db, **kwargs) -> None:
    """Schedule an audit log as a background task, swallowing any task-creation errors."""
    try:
        asyncio.create_task(db.log_extraction(**kwargs))
    except Exception as e:
        logger.error("Could not schedule extraction log task: %s", e)


# ── Upgrade 1 — Dynamic Text Extraction ───────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Raw text to extract structured data from.")
    target_schema: str = Field(
        ...,
        description=(
            "Plain-text description of the desired JSON output: field names, "
            "types, and constraints (e.g. allowed enum values)."
        ),
    )
    extra_instructions: Optional[str] = Field(None, description="Optional extra rules for this call.")
    use_grounding: bool = Field(
        False,
        description="Let Gemini search the web before extracting (fills missing real-world facts).",
    )

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("prompt must not be empty.")
        if len(v) > MAX_PROMPT_LEN:
            raise ValueError(f"prompt exceeds {MAX_PROMPT_LEN:,} character limit.")
        return v

    @field_validator("target_schema")
    @classmethod
    def validate_schema(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("target_schema must not be empty.")
        if len(v) > MAX_SCHEMA_LEN:
            raise ValueError(f"target_schema exceeds {MAX_SCHEMA_LEN:,} character limit.")
        return v


@router.post("/generate", summary="Extract structured data from text")
async def generate(
    body: GenerateRequest,
    request: Request,
    x_api_key: str = Header(..., description="Your AnyForge-AI API key."),
):
    """
    Universal dynamic-schema extraction from any text.
    Authenticate with the `X-API-Key` header.
    """
    client = await _get_client(request, x_api_key)
    db = request.app.state.db

    logger.info(
        "generate called | client=%s grounding=%s prompt_len=%d",
        client["project_name"], body.use_grounding, len(body.prompt),
    )

    result = await llm_service.extract_any(
        prompt=body.prompt,
        target_schema=body.target_schema,
        extra_instructions=body.extra_instructions or "",
        use_grounding=body.use_grounding,
    )

    success = result is not None

    _fire_log(
        db,
        client_id=client["id"],
        endpoint_used="/api/v1/generate",
        target_schema=body.target_schema,
        input_snippet=body.prompt,
        output_json=result,
        grounding_used=body.use_grounding,
        success=success,
        error_message=None if success else "Gemini extraction or JSON parse failed",
    )

    if not success:
        logger.warning("generate failed | client=%s", client["project_name"])
        raise HTTPException(
            status_code=422,
            detail="Could not extract structured data. Try rephrasing the prompt or clarifying the schema.",
        )

    logger.info("generate success | client=%s", client["project_name"])
    return {
        "status": "success",
        "client": client["project_name"],
        "grounding_used": body.use_grounding,
        "data": result,
    }


# ── Upgrade 2 — Vision / Multi-Modal Extraction ───────────────────────────────

class VisionExtractRequest(BaseModel):
    target_schema: str = Field(..., description="Plain-text description of the desired JSON output.")
    image_base64: Optional[str] = Field(
        None, description="Base64-encoded image bytes (data-URI prefix is auto-stripped)."
    )
    image_url: Optional[str] = Field(
        None, description="Publicly accessible image URL (fetched server-side)."
    )
    image_mime_type: str = Field("image/jpeg", description="MIME type of the image.")
    extra_instructions: Optional[str] = Field(None)
    use_grounding: bool = Field(False)

    @field_validator("target_schema")
    @classmethod
    def validate_schema(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("target_schema must not be empty.")
        if len(v) > MAX_SCHEMA_LEN:
            raise ValueError(f"target_schema exceeds {MAX_SCHEMA_LEN:,} character limit.")
        return v

    @field_validator("image_mime_type")
    @classmethod
    def validate_mime(cls, v: str) -> str:
        allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
        if v not in allowed:
            raise ValueError(f"image_mime_type must be one of: {', '.join(sorted(allowed))}.")
        return v


@router.post("/extract-vision", summary="Extract structured data from an image")
async def extract_vision(
    body: VisionExtractRequest,
    request: Request,
    x_api_key: str = Header(..., description="Your AnyForge-AI API key."),
):
    """
    Multi-modal image extraction — receipts, flyers, handwritten notes, whiteboards.
    Authenticate with the `X-API-Key` header. Supply `image_base64` OR `image_url`.
    """
    client = await _get_client(request, x_api_key)
    db = request.app.state.db

    if not body.image_base64 and not body.image_url:
        raise HTTPException(
            status_code=400,
            detail="Provide either image_base64 or image_url.",
        )

    source = "image_url" if body.image_url else "image_base64"
    logger.info(
        "extract-vision called | client=%s grounding=%s source=%s",
        client["project_name"], body.use_grounding, source,
    )

    result = await llm_service.extract_vision(
        target_schema=body.target_schema,
        image_base64=body.image_base64,
        image_url=body.image_url,
        image_mime_type=body.image_mime_type,
        extra_instructions=body.extra_instructions or "",
        use_grounding=body.use_grounding,
    )

    success = result is not None

    _fire_log(
        db,
        client_id=client["id"],
        endpoint_used="/api/v1/extract-vision",
        target_schema=body.target_schema,
        input_snippet=f"[{source}]",
        output_json=result,
        grounding_used=body.use_grounding,
        success=success,
        error_message=None if success else "Vision extraction or JSON parse failed",
    )

    if not success:
        logger.warning("extract-vision failed | client=%s source=%s", client["project_name"], source)
        raise HTTPException(
            status_code=422,
            detail="Could not extract structured data from the image. Ensure the image is clear and the schema matches its content.",
        )

    logger.info("extract-vision success | client=%s", client["project_name"])
    return {
        "status": "success",
        "client": client["project_name"],
        "source": source,
        "grounding_used": body.use_grounding,
        "data": result,
    }