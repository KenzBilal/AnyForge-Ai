from pydantic import BaseModel, Field

# ─── Generator/Extraction Schemas ──────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str = Field(..., max_length=20000, description="Text to extract data from")
    target_schema: str = Field(..., max_length=5000, description="JSON schema as string describing the output structure")
    grounding: bool = False


class VisionRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image")
    mime_type: str = Field("image/jpeg", description="Image MIME type")
    target_schema: str = Field(..., max_length=5000, description="JSON schema as string describing the output structure")


# ─── Webhook Specific Schemas ──────────────────────────────────────────────

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
