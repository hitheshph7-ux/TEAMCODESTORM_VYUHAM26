
from fastapi import FastAPI

app = FastAPI(
    title="AF-01 Workflow Orchestration Platform",
    description="Autonomous AI-Based Workflow Orchestration Platform",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to AF-01",
        "project": "Autonomous AI-Based Workflow Orchestration Platform",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "backend": "operational"
    }
