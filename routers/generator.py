"""
AnyForge-AI — Generator Router
================================
POST /api/v1/generate        — dynamic schema extraction from any text
POST /api/v1/extract-vision  — multi-modal extraction from images

Both endpoints:
  - Authenticate via X-API-Key header (validated against clients table)
  - Fire-and-forget log every extraction to extraction_logs
  - Support use_grounding=true for live web search before extraction
"""

import asyncio
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import Optional
from services.llm_service import llm_service

router = APIRouter()


# ─── Shared auth helper ───────────────────────────────────────────────────────

async def _get_client(request: Request, x_api_key: str) -> dict:
    """Validates X-API-Key and returns the client row, or raises 401."""
    db = request.app.state.db
    client = await db.validate_api_key(x_api_key)
    if not client:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key.")
    return client


# ─── Upgrade 1 — Dynamic Text Extraction ─────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Raw text to extract structured data from.")
    target_schema: str = Field(
        ...,
        description=(
            "Plain-text description of the desired JSON output fields, their types, "
            "and any constraints (e.g. allowed enum values)."
        ),
    )
    extra_instructions: Optional[str] = Field(None)
    use_grounding: bool = Field(
        False,
        description="Let Gemini search the web before extracting (fills missing facts).",
    )


@router.post("/generate")
async def generate(
    body: GenerateRequest,
    request: Request,
    x_api_key: str = Header(..., description="Your AnyForge-AI API key."),
):
    """
    Universal dynamic-schema extraction from text.
    Authenticate with X-API-Key header.
    """
    client = await _get_client(request, x_api_key)
    db = request.app.state.db

    result = await llm_service.extract_any(
        prompt=body.prompt,
        target_schema=body.target_schema,
        extra_instructions=body.extra_instructions or "",
        use_grounding=body.use_grounding,
    )

    success = result is not None

    # Fire-and-forget — log without blocking the response
    asyncio.create_task(db.log_extraction(
        client_id=client["id"],
        endpoint_used="/api/v1/generate",
        target_schema=body.target_schema,
        input_snippet=body.prompt,
        output_json=result,
        grounding_used=body.use_grounding,
        success=success,
        error_message=None if success else "Gemini extraction or JSON parse failed",
    ))

    if not success:
        raise HTTPException(
            status_code=422,
            detail="Could not extract structured data. Try rephrasing the prompt or clarifying the schema.",
        )

    return {
        "status": "success",
        "client": client["project_name"],
        "grounding_used": body.use_grounding,
        "data": result,
    }


# ─── Upgrade 2 — Vision / Multi-Modal Extraction ─────────────────────────────

class VisionExtractRequest(BaseModel):
    target_schema: str = Field(..., description="Plain-text description of the desired JSON output.")
    image_base64: Optional[str] = Field(None, description="Base64-encoded image (data-URI prefix auto-stripped).")
    image_url: Optional[str] = Field(None, description="Publicly accessible image URL.")
    image_mime_type: str = Field("image/jpeg")
    extra_instructions: Optional[str] = Field(None)
    use_grounding: bool = Field(False)


@router.post("/extract-vision")
async def extract_vision(
    body: VisionExtractRequest,
    request: Request,
    x_api_key: str = Header(..., description="Your AnyForge-AI API key."),
):
    """
    Multi-modal image extraction — receipts, flyers, handwritten notes, whiteboards.
    Authenticate with X-API-Key header. Supply image_base64 OR image_url.
    """
    client = await _get_client(request, x_api_key)
    db = request.app.state.db

    if not body.image_base64 and not body.image_url:
        raise HTTPException(status_code=400, detail="Provide either image_base64 or image_url.")

    result = await llm_service.extract_vision(
        target_schema=body.target_schema,
        image_base64=body.image_base64,
        image_url=body.image_url,
        image_mime_type=body.image_mime_type,
        extra_instructions=body.extra_instructions or "",
        use_grounding=body.use_grounding,
    )

    success = result is not None
    source = "image_url" if body.image_url else "image_base64"

    asyncio.create_task(db.log_extraction(
        client_id=client["id"],
        endpoint_used="/api/v1/extract-vision",
        target_schema=body.target_schema,
        input_snippet=f"[{source}]",
        output_json=result,
        grounding_used=body.use_grounding,
        success=success,
        error_message=None if success else "Vision extraction or JSON parse failed",
    ))

    if not success:
        raise HTTPException(
            status_code=422,
            detail="Could not extract structured data from the image. Ensure the image is clear and the schema matches its content.",
        )

    return {
        "status": "success",
        "client": client["project_name"],
        "source": source,
        "grounding_used": body.use_grounding,
        "data": result,
    }
