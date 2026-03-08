"""
AnyForge-AI — Generator Router v2
====================================
POST /api/v1/generate        — text → structured JSON
POST /api/v1/extract-vision  — image → structured JSON

Features:
- Per-API-key rate limiting (per minute + daily)
- Detailed error messages
- Usage headers in response
"""

import asyncio
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field
from services import db_service as db_module
from services.llm_service import llm_service

router = APIRouter(prefix="/api/v1", tags=["extraction"])


class GenerateRequest(BaseModel):
    prompt: str = Field(..., max_length=20000, description="Text to extract data from")
    target_schema: str = Field(..., max_length=5000, description="JSON schema as string describing the output structure")
    grounding: bool = False


class VisionRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image")
    mime_type: str = Field("image/jpeg", description="Image MIME type")
    target_schema: str = Field(..., max_length=5000, description="JSON schema as string describing the output structure")


def _authenticate(api_key: Optional[str]) -> dict:
    """Validate API key and return client dict, or raise HTTPException."""
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "missing_api_key",
                "message": "X-API-Key header is required.",
            }
        )
    db = db_module.db_service
    if not db:
        raise HTTPException(
            status_code=503,
            detail={"error": "service_unavailable", "message": "Database not ready. Try again shortly."}
        )
    client = db.validate_api_key(api_key)
    if not client:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "invalid_api_key",
                "message": "API key is invalid or has been deactivated.",
            }
        )
    return client


def _check_rate_limit(client: dict) -> None:
    """Check rate limits and raise HTTPException if exceeded."""
    db = db_module.db_service
    if not db:
        return
    rate = db.check_rate_limit(
        client_id=client["id"],
        limit_per_min=client.get("rate_limit_per_min", 20),
        daily_limit=client.get("daily_limit", 500),
    )
    if not rate["allowed"]:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": rate["reason"],
                "requests_this_minute": rate["requests_this_minute"],
                "requests_today": rate["requests_today"],
            }
        )


def _log(client, endpoint, schema, snippet, output, grounding, success, error=None):
    db = db_module.db_service
    if db:
        try:
            db.log_extraction(
                client=client,
                endpoint_used=endpoint,
                target_schema=schema,
                input_snippet=snippet,
                output_json=output,
                grounding_used=grounding,
                success=success,
                error_message=error,
            )
        except Exception:
            pass


@router.post("/generate")
async def generate(
    body: GenerateRequest,
    x_api_key: Optional[str] = Header(None),
):
    client = _authenticate(x_api_key)
    _check_rate_limit(client)

    from services.privacy_service import privacy_service
    # Step 1: PII Scrubbing
    scrubbed_prompt = privacy_service.scrub_text(body.prompt)

    result, error = None, None
    success = False

    try:
        result = await llm_service.extract_any(scrubbed_prompt, body.target_schema)
        success = True
    except ValueError as e:
        error = str(e)
        raise HTTPException(
            status_code=422,
            detail={"error": "schema_error", "message": f"Schema parsing failed: {error}"}
        )
    except Exception as e:
        error = str(e)
        raise HTTPException(
            status_code=500,
            detail={"error": "extraction_failed", "message": f"LLM extraction failed: {error}"}
        )
    finally:
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, lambda: _log(
            client, "/api/v1/generate",
            body.target_schema, scrubbed_prompt[:500],
            result, body.grounding, success, error
        ))

    return {"result": result}


@router.post("/extract-vision")
async def extract_vision(
    body: VisionRequest,
    x_api_key: Optional[str] = Header(None),
):
    client = _authenticate(x_api_key)
    _check_rate_limit(client)

    result, error = None, None
    success = False

    try:
        result = await llm_service.extract_vision(
            body.target_schema, body.image_base64, None, body.mime_type
        )
        success = True
    except Exception as e:
        error = str(e)
        raise HTTPException(
            status_code=500,
            detail={"error": "vision_extraction_failed", "message": f"Vision extraction failed: {error}"}
        )
    finally:
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, lambda: _log(
            client, "/api/v1/extract-vision",
            body.target_schema, "[image]",
            result, False, success, error
        ))

    return {"result": result}