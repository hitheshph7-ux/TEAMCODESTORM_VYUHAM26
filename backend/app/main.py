from fastapi import FastAPI

app = FastAPI(
    title="VYUHAM",
    description="Autonomous AI-Based Workflow Orchestration Platform",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to VYUHAM",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "VYUHAM"
    }
