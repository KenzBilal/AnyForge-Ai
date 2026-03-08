from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import webhooks, generator
from services import db_service as db_module
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once at startup / shutdown.
    We await the async Supabase client here and store it on app.state so
    routers can access it via request.app.state.db — no global singleton needed.
    """
    print("[Startup] Initialising async Supabase client...")
    app.state.db = await db_module.DBService.create()
    print("[Startup] Supabase client ready.")
    yield
    # Any teardown logic goes here (e.g. closing connection pools)
    print("[Shutdown] AnyForge-AI stopped.")


app = FastAPI(
    title="AnyForge-AI Agent",
    description="Universal structured-data extraction microservice — text, vision, and web-grounded",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(generator.router, prefix="/api/v1", tags=["Generator"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AnyForge-AI"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
