"""
AnyForge-AI — Main Application v2
====================================
Universal structured-data extraction microservice.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Validate required env vars at startup
_REQUIRED = ["GROQ_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
_missing = [v for v in _REQUIRED if not os.getenv(v)]
if _missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")

from services import db_service as db_module
from services.llm_service import llm_service
from routers import generator, webhooks, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_module.db_service = db_module.DBService.create()
    llm_service.configure()
    print("[AnyForge-AI] v2 started successfully.")
    yield
    print("[AnyForge-AI] Shutting down.")


app = FastAPI(
    title="AnyForge-AI",
    description="Universal structured-data extraction microservice",
    version="2.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generator.router)
app.include_router(webhooks.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AnyForge-AI", "version": "2.2.0"}