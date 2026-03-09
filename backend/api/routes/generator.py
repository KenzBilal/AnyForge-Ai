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
from fastapi import APIRouter, HTTPException, Depends
from services import db_service as db_module
from services.llm_service import llm_service
from schemas.extraction import GenerateRequest, VisionRequest
from api.dependencies import check_rate_limit_dep

router = APIRouter(prefix="/api/v1", tags=["extraction"])

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
    client: dict = Depends(check_rate_limit_dep),
):
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
    client: dict = Depends(check_rate_limit_dep),
):
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