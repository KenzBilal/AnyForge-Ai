"""
AnyForge-AI — Entry Point
==========================
FastAPI app init, lifespan, middleware, and router registration.
"""

import os
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import webhooks, generator
from services import db_service as db_module
from services.llm_service import llm_service  # lazy-safe singleton

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("anyforge")


# ── Startup / Shutdown ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AnyForge-AI...")

    # Validate required env vars before doing anything else
    missing = [v for v in ("GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
               if not os.getenv(v)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    # Initialise async Supabase client once and store on app.state
    logger.info("Initialising Supabase client...")
    app.state.db = await db_module.DBService.create()
    logger.info("Supabase client ready.")

    # Validate Gemini is configured (llm_service init is lazy-safe now)
    llm_service.configure()
    logger.info("Gemini LLM service ready.")

    yield

    logger.info("AnyForge-AI shutting down.")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AnyForge-AI",
    description="Universal structured-data extraction microservice — text, vision, and web-grounded.",
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ───────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "detail": "Internal server error."},
    )


# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(generator.router, prefix="/api/v1", tags=["Generator"])


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "AnyForge-AI", "version": "2.1.0"}


# ── Local dev ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)