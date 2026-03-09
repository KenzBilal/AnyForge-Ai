from fastapi import Header, HTTPException, Depends
from typing import Optional
from services import db_service as db_module

async def get_db_service():
    """Dependency to provide the central DBService instance."""
    db = db_module.db_service
    if not db:
        raise HTTPException(
            status_code=503,
            detail={"error": "service_unavailable", "message": "Database not ready. Try again shortly."}
        )
    return db


async def authenticate_api_key(
    x_api_key: Optional[str] = Header(None), 
    db=Depends(get_db_service)
) -> dict:
    """Dependency to strictly authenticate the X-API-Key."""
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail={"error": "missing_api_key", "message": "X-API-Key header is required."}
        )

    client = db.validate_api_key(x_api_key)
    if not client:
        raise HTTPException(
            status_code=403,
            detail={"error": "invalid_api_key", "message": "API key is invalid or has been deactivated."}
        )
    return client


async def check_rate_limit_dep(
    client: dict = Depends(authenticate_api_key),
    db=Depends(get_db_service)
) -> dict:
    """Dependency to seamlessly enforce rate limits for the authenticated client."""
    rate = db.check_rate_limit(
        client_id=client["id"],
        limit_per_min=client.get("rate_limit_per_min", 20),
        daily_limit=client.get("daily_limit", 500),
    )
    
    if not rate["allowed"]:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": rate["reason"],
                "requests_this_minute": rate["requests_this_minute"],
                "requests_today": rate["requests_today"],
            }
        )
        
    return client
