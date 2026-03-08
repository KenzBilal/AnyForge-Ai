"""
AnyForge-AI — Email Webhook Router
=====================================
POST /webhooks/email/create-event

Email providers (Resend, SendGrid, Postmark) call this when an email
arrives at a designated inbound address (e.g. eventforge@anyforge.ai).

Authentication: the destination address is mapped to an API key stored
in the clients table (`inbound_email` column — see below).

Schema override: clients can put `schema::<description>` as the email
subject to extract any schema, not just EventSchema.

Improvements over v1:
  - Structured logging
  - Inbound email → API key mapping loaded from DB (not a hardcoded dict)
  - Cleaner separation between steps
  - Consistent return shape
"""

import asyncio
import logging
from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr
from typing import Optional

from services.llm_service import llm_service, EVENT_SCHEMA_DESCRIPTION

logger = logging.getLogger("anyforge.webhooks")
router = APIRouter()


class EmailWebhookPayload(BaseModel):
    """
    Standard inbound email payload.
    Field names match Resend's inbound webhook format.
    Adjust `sender_email` / `text_body` field names for SendGrid or Postmark.
    """
    to:           EmailStr         # destination address — maps to a client
    sender_email: EmailStr         # who sent it (logged only)
    subject:      str
    text_body:    str


@router.post(
    "/email/create-event",
    status_code=200,
    summary="Inbound email → structured JSON extraction",
)
async def email_create_event(payload: EmailWebhookPayload, request: Request):
    """
    Receives an inbound email webhook and extracts structured data via Gemini.
    Always returns HTTP 200 so the email provider never retries.

    To register an inbound address, add an `inbound_email` column to the
    clients table and set it for each client row.
    """
    db = request.app.state.db

    logger.info(
        "Inbound email | to=%s from=%s subject=%.80s",
        payload.to, payload.sender_email, payload.subject,
    )

    # ── Step 1: Map destination address → client ───────────────────────────────
    # Looks up `inbound_email` column in clients table.
    # Falls back gracefully if the column doesn't exist yet.
    client = await _resolve_client_by_email(db, str(payload.to).lower())
    if not client:
        logger.warning("No client registered for inbound address: %s", payload.to)
        return {"status": "ignored", "reason": "destination_not_registered"}

    # ── Step 2: Determine target schema ───────────────────────────────────────
    # Client can override by putting  schema::<description>  as the subject
    target_schema = EVENT_SCHEMA_DESCRIPTION
    subject_lower = payload.subject.strip().lower()
    if subject_lower.startswith("schema::"):
        target_schema = payload.subject.split("::", 1)[1].strip()
        logger.info("Schema override detected for client: %s", client["project_name"])

    # ── Step 3: Call Gemini ───────────────────────────────────────────────────
    prompt = f"Subject: {payload.subject}\n\nEmail Body:\n{payload.text_body}".strip()

    result = await llm_service.extract_any(
        prompt=prompt,
        target_schema=target_schema,
    )

    success = result is not None

    # ── Step 4: Fire-and-forget audit log ─────────────────────────────────────
    try:
        asyncio.create_task(db.log_extraction(
            client_id=client["id"],
            endpoint_used="/webhooks/email/create-event",
            target_schema=target_schema,
            input_snippet=prompt,
            output_json=result,
            grounding_used=False,
            success=success,
            error_message=None if success else "Gemini extraction failed",
        ))
    except Exception as e:
        logger.error("Could not schedule webhook log task: %s", e)

    # ── Step 5: Return 200 regardless (email providers retry on non-200) ──────
    if not success:
        logger.error("Extraction failed | client=%s from=%s", client["project_name"], payload.sender_email)
        return {"status": "error", "reason": "ai_extraction_failed"}

    logger.info("Extraction success | client=%s", client["project_name"])
    return {
        "status": "success",
        "client": client["project_name"],
        "data": result,
    }


# ── Helper ─────────────────────────────────────────────────────────────────────

async def _resolve_client_by_email(db, inbound_email: str) -> Optional[dict]:
    """
    Looks up a client row by its inbound_email address.
    Returns None if not found or if the inbound_email column doesn't exist.

    To enable this, run:
        ALTER TABLE clients ADD COLUMN inbound_email TEXT UNIQUE;
    Then set it per client:
        UPDATE clients SET inbound_email = 'eventforge@anyforge.ai' WHERE project_name = 'EventForge';
    """
    try:
        result = (
            await db.client.table("clients")
            .select("id, project_name")
            .eq("inbound_email", inbound_email)
            .eq("is_active", True)
            .single()
            .execute()
        )
        return result.data or None
    except Exception as e:
        logger.error("Could not resolve client by inbound email '%s': %s", inbound_email, e)
        return None