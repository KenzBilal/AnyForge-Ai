"""
AnyForge-AI — Admin Router
============================
All endpoints require ADMIN_API_KEY header (set as env var).

GET  /admin/clients              — list all clients with usage stats
POST /admin/clients              — create new API key
PATCH /admin/clients/{id}        — enable/disable client
DELETE /admin/clients/{id}       — delete client
GET  /admin/clients/{id}/usage   — detailed usage for one client
"""

import os
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from services import db_service as db_module

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(admin_key: Optional[str]) -> None:
    expected = os.getenv("ADMIN_API_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail={"error": "admin_not_configured", "message": "ADMIN_API_KEY env var not set."})
    if admin_key != expected:
        raise HTTPException(status_code=403, detail={"error": "forbidden", "message": "Invalid admin key."})


class CreateClientRequest(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=100)
    rate_limit_per_min: int = Field(20, ge=1, le=1000)
    daily_limit: int = Field(500, ge=1, le=100000)


class ToggleClientRequest(BaseModel):
    is_active: bool


@router.get("/clients")
def list_clients(x_admin_key: Optional[str] = Header(None)):
    _require_admin(x_admin_key)
    db = db_module.db_service
    if not db:
        raise HTTPException(status_code=503, detail={"error": "db_not_ready"})
    return {"clients": db.list_clients()}


@router.post("/clients", status_code=201)
def create_client(
    body: CreateClientRequest,
    x_admin_key: Optional[str] = Header(None),
):
    _require_admin(x_admin_key)
    db = db_module.db_service
    if not db:
        raise HTTPException(status_code=503, detail={"error": "db_not_ready"})
    client = db.create_client(
        project_name=body.project_name,
        rate_limit_per_min=body.rate_limit_per_min,
        daily_limit=body.daily_limit,
    )
    if not client:
        raise HTTPException(status_code=500, detail={"error": "create_failed", "message": "Failed to create client."})
    return {"client": client}


@router.patch("/clients/{client_id}")
def toggle_client(
    client_id: str,
    body: ToggleClientRequest,
    x_admin_key: Optional[str] = Header(None),
):
    _require_admin(x_admin_key)
    db = db_module.db_service
    if not db:
        raise HTTPException(status_code=503, detail={"error": "db_not_ready"})
    ok = db.toggle_client(client_id, body.is_active)
    if not ok:
        raise HTTPException(status_code=500, detail={"error": "update_failed"})
    return {"success": True, "is_active": body.is_active}


@router.delete("/clients/{client_id}")
def delete_client(
    client_id: str,
    x_admin_key: Optional[str] = Header(None),
):
    _require_admin(x_admin_key)
    db = db_module.db_service
    if not db:
        raise HTTPException(status_code=503, detail={"error": "db_not_ready"})
    ok = db.delete_client(client_id)
    if not ok:
        raise HTTPException(status_code=500, detail={"error": "delete_failed"})
    return {"success": True}


@router.get("/clients/{client_id}/usage")
def get_client_usage(
    client_id: str,
    x_admin_key: Optional[str] = Header(None),
):
    _require_admin(x_admin_key)
    db = db_module.db_service
    if not db:
        raise HTTPException(status_code=503, detail={"error": "db_not_ready"})
    usage = db.get_client_usage(client_id)
    if not usage:
        raise HTTPException(status_code=404, detail={"error": "client_not_found"})
    return {"usage": usage}