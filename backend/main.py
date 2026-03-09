"""
AnyForge-AI — Main Application v2
====================================
Universal structured-data extraction microservice.
Now using Clean Architecture (Settings + Dependencies DI + Schemas)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# This triggers immediate validation of required environment variables 
from core.config import settings

from services import db_service as db_module
from services.llm_service import llm_service
from services.privacy_service import privacy_service
from api.routes import generator, webhooks, admin, async_jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the core engines singletons
    db_module.db_service = db_module.DBService.create()
    llm_service.configure()
    privacy_service.configure()
    
    # Store inside state for anything globally dependent on app
    app.state.db = db_module.db_service
    
    print("[AnyForge-AI] v2 successfully injected and started.")
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

# Connect the heavily refactored cleanly separated REST APIs
app.include_router(generator.router)
app.include_router(webhooks.router)
app.include_router(admin.router)
app.include_router(async_jobs.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AnyForge-AI (Clean Architecture)", "version": "2.2.0"}


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)