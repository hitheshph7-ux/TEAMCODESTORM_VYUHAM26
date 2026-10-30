from fastapi import APIRouter
from app.api.routes import workflows, tasks, approvals, logs

api_router = APIRouter()
api_router.include_router(workflows.router)
api_router.include_router(tasks.router)
api_router.include_router(approvals.router)
api_router.include_router(logs.router)
