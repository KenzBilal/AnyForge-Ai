"""
AnyForge-AI — Generator Router
================================
POST /api/v1/generate        — text → structured JSON
POST /api/v1/extract-vision  — image → structured JSON
"""

import asyncio
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field
from services import db_service as db_module
from services.llm_service import llm_service

router = APIRouter(prefix="/api/v1", tags=["extraction"])


class GenerateRequest(BaseModel):
    prompt: str = Field(..., max_length=20000)
    target_schema: str = Field(..., max_length=5000)
    grounding: bool = False


class VisionRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"
    target_schema: str = Field(..., max_length=5000)


def _get_client(api_key: str) -> dict:
    if not api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header required")
    db = db_module.db_service
    if not db:
        raise HTTPException(status_code=503, detail="Database not initialized")
    client = db.validate_api_key(api_key)
    if not client:
        raise HTTPException(status_code=403, detail="Invalid or inactive API key")
    return client


@router.post("/generate")
async def generate(
    body: GenerateRequest,
    x_api_key: Optional[str] = Header(None),
):
    client = _get_client(x_api_key)
    result, error = None, None
    success = False

    try:
        result = await llm_service.extract_any(body.prompt, body.target_schema)
        success = True
    except Exception as e:
        error = str(e)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {error}")
    finally:
        db = db_module.db_service
        if db:
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: db.log_extraction(
                    client_id=client["id"],
                    endpoint_used="/api/v1/generate",
                    target_schema=body.target_schema,
                    input_snippet=body.prompt[:500],
                    output_json=result,
                    grounding_used=body.grounding,
                    success=success,
                    error_message=error,
                ),
            )

    return {"result": result}


@router.post("/extract-vision")
async def extract_vision(
    body: VisionRequest,
    x_api_key: Optional[str] = Header(None),
):
    client = _get_client(x_api_key)
    result, error = None, None
    success = False

    try:
        result = await llm_service.extract_vision(
            body.image_base64, body.mime_type, body.target_schema
        )
        success = True
    except Exception as e:
        error = str(e)
        raise HTTPException(status_code=500, detail=f"Vision extraction failed: {error}")
    finally:
        db = db_module.db_service
        if db:
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: db.log_extraction(
                    client_id=client["id"],
                    endpoint_used="/api/v1/extract-vision",
                    target_schema=body.target_schema,
                    input_snippet="[image]",
                    output_json=result,
                    grounding_used=False,
                    success=success,
                    error_message=error,
                ),
            )

    return {"result": result}