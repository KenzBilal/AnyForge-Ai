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
from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional

from services.llm_service import llm_service
from schemas.extraction import EventSchema

logger = logging.getLogger("anyforge.webhooks")
router = APIRouter()

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
    Receives an inbound email webhook and extracts structured data via Groq LLM.
    Always returns HTTP 200 so the email provider never retries.
    """
    db = request.app.state.db

    logger.info(
        "Inbound email | to=%s from=%s subject=%.80s",
        payload.to, payload.sender_email, payload.subject,
    )

    client = await _resolve_client_by_email(db, str(payload.to).lower())
    if not client:
        logger.warning("No client registered for inbound address: %s", payload.to)
        return {"status": "ignored", "reason": "destination_not_registered"}

    target_schema = EVENT_SCHEMA_DESCRIPTION
    subject_lower = payload.subject.strip().lower()
    if subject_lower.startswith("schema::"):
        target_schema = payload.subject.split("::", 1)[1].strip()
        logger.info("Schema override detected for client: %s", client["project_name"])

    prompt = f"Subject: {payload.subject}\n\nEmail Body:\n{payload.text_body}".strip()

    result = await llm_service.extract_any(
        prompt=prompt,
        target_schema=target_schema,
    )

    success = result is not None

    try:
        asyncio.create_task(db.log_extraction(
            client_id=client["id"],
            endpoint_used="/webhooks/email/create-event",
            target_schema=target_schema,
            input_snippet=prompt,
            output_json=result,
            grounding_used=False,
            success=success,
            error_message=None if success else "LLM extraction failed",
        ))
    except Exception as e:
        logger.error("Could not schedule webhook log task: %s", e)

    if not success:
        logger.error("Extraction failed | client=%s from=%s", client["project_name"], payload.sender_email)
        return {"status": "error", "reason": "ai_extraction_failed"}

    logger.info("Extraction success | client=%s", client["project_name"])
    return {
        "status": "success",
        "client": client["project_name"],
        "data": result,
    }

async def _resolve_client_by_email(db, inbound_email: str) -> Optional[dict]:
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