# AnyForge-AI

![AnyForge Architecture](https://img.shields.io/badge/Architecture-Clean%20%2810%2F10%29-blueviolet) ![FastAPI](https://img.shields.io/badge/FastAPI-100%2B-green) ![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-orange)

A perfectly architected, self-hosted FastAPI microservice and premium React dashboard that seamlessly turns **any unstructured content** (text, email, images, handwritten notes, receipts, flyers) into perfectly structured JSON. 

AnyForge utilizes the blazing fast **Groq API** and handles real-time extraction, web grounding, vision extraction from receipts, and automated email webhook parsing directly from Resend/SendGrid.

## 📖 Official Documentation Modules

We believe massive `README` files are incredibly hard to digest. To give you the best developer experience, we have carefully broken down our platform specifics into the following detailed guides:

- 📚 [**API Reference**](./docs/API_REFERENCE.md): Read about endpoints, request headers, error handling, and JSON schemas for Text Extraction, Vision Extraction, Async Tasks, and Webhooks.
- 🏗️ [**System Architecture**](./docs/ARCHITECTURE.md): Learn how the backend uses a robust 10/10 Clean Architecture model (Strict dependency injection, abstracted Pydantic schemas, isolated routing layers) and how the dashboard connects securely to Supabase.
- 🚀 [**Deployment Guide**](./docs/DEPLOYMENT.md): Detailed local setup tutorials and production deployment recipes for Vercel, Railway, and Render platforms.

---

## ⚡ Quick Start (TL;DR)

If you already know what you're doing, the backend requires:
* `GROQ_API_KEY`
* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`
* `ADMIN_API_KEY`

It operates on standard `uvicorn main:app` directly from the `backend/` directory. For client side API Keys generation, configure your `frontend/.env` to point to Supabase directly and hook the Web Application up via Vite standard defaults.

Head over to the [Deployment Guide](./docs/DEPLOYMENT.md) if you run into any trouble.
