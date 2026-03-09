import uuid
import asyncio
import httpx
from typing import Optional, Dict
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, HttpUrl
from api.dependencies import check_rate_limit_dep, authenticate_api_key
from api.routes.generator import _log
from services.llm_service import llm_service
from services.privacy_service import privacy_service

router = APIRouter(prefix="/api/v1", tags=["async_jobs"])

# In-memory job store for demo purposes. 
# In a robust production environment, this would be stored in Upstash Redis.
jobs_store: Dict[str, dict] = {}

class AsyncGenerateRequest(BaseModel):
    prompt: str
    target_schema: str
    webhook_url: Optional[HttpUrl] = None

async def process_async_job(job_id: str, client: dict, prompt: str, schema: str, webhook_url: Optional[HttpUrl]):
    jobs_store[job_id]["status"] = "processing"
    
    try:
        scrubbed_prompt = privacy_service.scrub_text(prompt)
        
        # Utilize the large document chunking method
        result = await llm_service.extract_large_document(scrubbed_prompt, schema)
        
        jobs_store[job_id]["status"] = "completed"
        jobs_store[job_id]["result"] = result
        
        _log(client, "/api/v1/generate/async", schema, scrubbed_prompt[:500], result, False, True, None)
        
        if webhook_url:
            async with httpx.AsyncClient() as http:
                await http.post(str(webhook_url), json={"job_id": job_id, "status": "completed", "result": result})
                
    except Exception as e:
        error_msg = str(e)
        jobs_store[job_id]["status"] = "failed"
        jobs_store[job_id]["error"] = error_msg
        
        _log(client, "/api/v1/generate/async", schema, prompt[:500], None, False, False, error_msg)
        
        if webhook_url:
            try:
                async with httpx.AsyncClient() as http:
                    await http.post(str(webhook_url), json={"job_id": job_id, "status": "failed", "error": error_msg})
            except:
                pass

@router.post("/generate/async")
async def generate_async(
    body: AsyncGenerateRequest,
    background_tasks: BackgroundTasks,
    client: dict = Depends(check_rate_limit_dep),
):
    job_id = str(uuid.uuid4())
    jobs_store[job_id] = {"status": "queued", "result": None, "error": None}
    
    background_tasks.add_task(
        process_async_job, 
        job_id, 
        client, 
        body.prompt, 
        body.target_schema, 
        body.webhook_url
    )
    
    return {"job_id": job_id, "status": "queued"}

@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str, 
    client: dict = Depends(authenticate_api_key)
):
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_store[job_id]
