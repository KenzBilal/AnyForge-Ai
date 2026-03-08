# AnyForge-AI — Universal Structured Extraction Microservice

A self-hosted FastAPI microservice that turns **any unstructured content** (text, email, images, handwritten notes, receipts, flyers) into perfectly structured JSON — using Gemini 2.0 Flash.

---

## Architecture

```
anyforge-ai/
├── main.py                          # App init, lifespan, router registration
├── requirements.txt
├── .env.example
├── routers/
│   ├── webhooks.py                  # POST /webhooks/email/create-event
│   └── generator.py                 # POST /api/v1/generate  +  POST /api/v1/extract-vision
└── services/
    ├── llm_service.py               # All three Gemini capabilities
    └── db_service.py                # Async Supabase client (Service Role)
```

---

## The Three Upgrades

### Upgrade 1 — Dynamic Schema Extraction · `POST /api/v1/generate`

No longer locked to EventSchema. Pass **any prompt + any schema description**.

**Request:**
```json
{
  "prompt": "Bug: app crashes on iOS 17 when opening settings. Severity: critical.",
  "target_schema": "{\"title\": \"string\", \"severity\": \"enum: low|medium|high|critical\", \"platform\": \"string\", \"steps_to_reproduce\": \"array of strings\"}",
  "use_grounding": false
}
```

**Response:**
```json
{
  "status": "success",
  "grounding_used": false,
  "data": {
    "title": "App crash on iOS 17 when opening settings",
    "severity": "critical",
    "platform": "iOS 17",
    "steps_to_reproduce": ["Open app", "Tap settings", "App crashes"]
  }
}
```

---

### Upgrade 2 — Vision Extraction · `POST /api/v1/extract-vision`

Feed Gemini an image (receipt, handwritten note, event flyer, business card, whiteboard).

**Request (URL):**
```json
{
  "target_schema": "{\"event_name\": \"string\", \"date\": \"string\", \"venue\": \"string\", \"ticket_price\": \"string\"}",
  "image_url": "https://example.com/event-flyer.jpg"
}
```

**Request (base64):**
```json
{
  "target_schema": "{\"vendor\": \"string\", \"total_amount\": \"number\", \"items\": \"array of {name, price}\"}",
  "image_base64": "/9j/4AAQSkZJRgABAQEA...",
  "image_mime_type": "image/jpeg"
}
```

---

### Upgrade 3 — Web Grounding · add `"use_grounding": true` to any request

When the content references real-world facts, Gemini silently searches the internet first.

```json
{
  "prompt": "Create an event for Google I/O this year.",
  "target_schema": "{ ...EventSchema fields... }",
  "use_grounding": true
}
```

Gemini fetches the actual dates before returning JSON — no hallucinations.

> **Note:** `use_grounding: true` disables `response_mime_type: application/json` (Gemini API limitation). The service handles this transparently via the system prompt + manual JSON parsing.

---

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Fill in GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
python main.py
# Docs → http://localhost:8000/docs
```

---

## Schema Description Format

`target_schema` is plain text — describe fields however is clearest:

```
# Typed JSON
{"name": "string", "score": "float 0-1", "status": "enum: active|inactive"}

# Prose
A JSON with: title (string), release_year (integer), genres (array of strings), rating (float 0-10)
```

---

## Example Use Cases

| Input | Schema | Output fields |
|---|---|---|
| Email about bug | BugTracker | `severity`, `steps_to_reproduce`, `platform` |
| Recipe email | Cooking | `ingredients[]`, `prep_time`, `servings` |
| Photo of receipt | Receipt | `vendor`, `total`, `items[]`, `date` |
| Job posting | Job | `role`, `salary_range`, `skills[]`, `remote` |
| Handwritten note | Custom | Any fields you define |
| "What are Google I/O dates?" + grounding | Event | Accurate dates from the web |

---

## Deployment

Stateless — deploy to Railway, Render, Fly.io, or Google Cloud Run.
Set `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` as environment secrets.
