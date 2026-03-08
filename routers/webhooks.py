"""
AnyForge-AI — Email Webhook Router
=====================================
POST /webhooks/email/create-event

Email providers (Resend, SendGrid, Postmark) call this when an email
arrives at a designated address (e.g. eventforge@anyforge.ai).

Authentication: the destination address is mapped to an API key.
Each client project gets its own inbound email address —
eventforge@anyforge.ai → EventForge API key
cashtree@anyforge.ai   → Cashtree API key
...and so on.

The email body is extracted using the EventSchema by default, but the
client can override target_schema by including it in the email subject
with the format:  schema::<schema_description>
"""

import asyncio
from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from services.llm_service import llm_service, EVENT_SCHEMA_DESCRIPTION

router = APIRouter()

# Maps inbound destination addresses to client API keys.
# In production, move this into the clients table as an `inbound_email` column.
INBOUND_EMAIL_TO_API_KEY: dict = {
    # "eventforge@anyforge.ai": "your-eventforge-api-key",
    # "cashtree@anyforge.ai":   "your-cashtree-api-key",
    # Populated from env or DB at startup — hardcoded here for clarity
}


class EmailWebhookPayload(BaseModel):
    """
    Standard inbound email payload.
    Field names match Resend's inbound format — adjust for SendGrid/Postmark.
    """
    to:           EmailStr         # destination — maps to a client
    sender_email: EmailStr         # who sent it (for logging only — no longer used for auth)
    subject:      str
    text_body:    str


@router.post("/email/create-event", status_code=200)
async def email_create_event(payload: EmailWebhookPayload, request: Request):
    """
    Inbound email → structured JSON → logged to extraction_logs.
    Always returns 200 so the email provider never retries.
    """
    db = request.app.state.db

    # ── Step 1: Map destination address → client ──────────────────────────────
    api_key = INBOUND_EMAIL_TO_API_KEY.get(str(payload.to).lower())
    if not api_key:
        print(f"[Webhook] No client mapped to destination: {payload.to}")
        return {"status": "ignored", "reason": "destination_not_registered"}

    client = await db.validate_api_key(api_key)
    if not client:
        print(f"[Webhook] Invalid or inactive API key for: {payload.to}")
        return {"status": "ignored", "reason": "invalid_api_key"}

    # ── Step 2: Determine schema (default = EventSchema) ─────────────────────
    # Clients can override by putting  schema::<description>  in the subject line
    target_schema = EVENT_SCHEMA_DESCRIPTION
    if payload.subject.lower().startswith("schema::"):
        target_schema = payload.subject.split("::", 1)[1].strip()

    # ── Step 3: Build prompt and call Gemini ──────────────────────────────────
    prompt = f"Subject: {payload.subject}\n\nEmail Body:\n{payload.text_body}".strip()

    result = await llm_service.extract_any(
        prompt=prompt,
        target_schema=target_schema,
    )

    success = result is not None

    # ── Step 4: Fire-and-forget audit log ─────────────────────────────────────
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

    if not success:
        print(f"[Webhook] Extraction failed for email from {payload.sender_email}")
        return {"status": "error", "reason": "ai_extraction_failed"}

    print(f"[Webhook] Extraction success for client '{client['project_name']}'")

    # ── Step 5: Return 200 to close the webhook connection ────────────────────
    return {
        "status": "success",
        "client": client["project_name"],
        "data": result,
    }
