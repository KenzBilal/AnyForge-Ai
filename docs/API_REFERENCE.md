# AnyForge-AI API Reference

This document covers all the HTTP endpoints exposed by the backend microservice. All core extraction endpoints are hosted under `/api/v1`. 

## Authentication
Every `/api/v1` and `/admin` endpoint requires authentication via an HTTP header.
- **Client Endpoints**: Pass `X-API-Key: <your-client-api-key>`
- **Admin Endpoints**: Pass `X-Admin-Key: <ADMIN_API_KEY>`

---

## 1. Dynamic Text Extraction
**`POST /api/v1/generate`**

Uploads unstructured text (like bug reports, articles, lists) and returns a perfectly typed JSON object that matches the requested schema.

### Request Body
```json
{
  "prompt": "Bug: app crashes on iOS 17 when opening settings. Severity: critical.",
  "target_schema": "{\"title\": \"string\", \"severity\": \"enum: low|medium|high|critical\", \"platform\": \"string\", \"steps_to_reproduce\": \"array of strings\"}",
  "grounding": false
}
```
**Options:**
- `grounding` (boolean): If `true`, the model will perform live Google searches to verify facts before returning the object. Ideal for fetching live dates or current event data.

### Response
```json
{
  "result": {
    "title": "App crash on iOS 17 when opening settings",
    "severity": "critical",
    "platform": "iOS 17",
    "steps_to_reproduce": [
      "Open app",
      "Tap settings",
      "App crashes"
    ]
  }
}
```

---

## 2. Vision / Image Extraction
**`POST /api/v1/extract-vision`**

Uploads a base64 string of an image (like a receipt, flyer, or handwritten note) and extracts structured data based on the schema.

### Request Body
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "mime_type": "image/jpeg",
  "target_schema": "{\"vendor\": \"string\", \"total_amount\": \"number\", \"items\": \"array of {name, price}\"}"
}
```

### Response
```json
{
  "result": {
    "vendor": "Starbucks",
    "total_amount": 5.45,
    "items": [
      {
        "name": "Latte",
        "price": 5.45
      }
    ]
  }
}
```

---

## 3. Asynchronous Extractions
**`POST /api/v1/generate/async`**

For massive documents that take too long to process synchronously, use the async jobs endpoint. The system chunks large documents safely, processes them concurrently, and merges the results.

### Request Body
```json
{
  "prompt": "<MASSIVE 50-PAGE TXT CONTENT>",
  "target_schema": "{\"abstract\": \"string\", \"key_points\": \"list of strings\"}",
  "webhook_url": "https://yourdomain.com/callbacks/job-complete"
}
```

### Response
```json
{
  "job_id": "8a32d1f9-4b67-4d92-9e56-11ac98fca3cf",
  "status": "queued"
}
```
You can poll the status at **`GET /api/v1/jobs/{job_id}`** or wait for the system to POST results to your `webhook_url`.

---

## 4. Email Webhooks
**`POST /webhooks/email/create-event`**

Built specifically for hooking up services like Resend or Sendgrid to pipe in incoming emails natively. The system dynamically resolves the target email address (`to`) to a registered client using the database's `inbound_email` column.

If the email subject begins with `schema::<your description>`, it will override the default mapping.

---

## 5. Admin Utilities
Admin routes require the exact `ADMIN_API_KEY` loaded in the application `.env`.

- **`GET /admin/clients`** — Returns all clients and rate limits.
- **`POST /admin/clients`** — Generates a new API Key for a project.
- **`PATCH /admin/clients/{id}`** — Enable or disable a client.
- **`DELETE /admin/clients/{id}`** — Hard deletes a client.
- **`POST /admin/clients/{id}/rotate-key`** — Invalidates the current Key and dispenses a new one.
