"""
Workflow API Routes
"""
import threading
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.workflow import WorkflowCreate, WorkflowResponse, WorkflowDetailResponse, WorkflowStatusResponse
from app.schemas.task import TaskResponse
from app.schemas.log import ExecutionLogResponse
from app.services.workflow_service import (
    create_workflow, get_workflow, list_workflows,
    list_workflow_tasks, cancel_workflow, get_dashboard_stats,
    update_workflow_status,
)
from app.services.audit_service import log_event
from app.models.entities import ExecutionLog, Task, Approval


router = APIRouter(prefix="/api/workflows", tags=["workflows"])


def _run_workflow_background(workflow_id: str, objective: str, execution_mode: str, simulate_failure: bool):
    """Run workflow graph in background thread."""
    try:
        from app.orchestration.graph import run_workflow_graph
        run_workflow_graph(workflow_id, objective, execution_mode, simulate_failure)
    except Exception as e:
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            update_workflow_status(db, workflow_id, "failed")
            log_event(db, workflow_id, "workflow_graph_error", "error", error_message=str(e))
        finally:
            db.close()


@router.post("", response_model=WorkflowResponse, status_code=201)
def create_new_workflow(
    payload: WorkflowCreate,
    db: Session = Depends(get_db),
):
    """Create a new workflow with an objective."""
    wf = create_workflow(db, payload.objective, payload.execution_mode or "demo")
    return wf


@router.get("", response_model=List[WorkflowResponse])
def list_all_workflows(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List all workflows."""
    return list_workflows(db, skip=skip, limit=limit)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    stats = get_dashboard_stats(db)
    # Convert recent_workflows to response format
    recent = [WorkflowResponse.model_validate(w) for w in stats["recent_workflows"]]
    return {
        **{k: v for k, v in stats.items() if k != "recent_workflows"},
        "recent_workflows": [w.model_dump() for w in recent],
    }


@router.get("/{workflow_id}", response_model=WorkflowDetailResponse)
def get_workflow_detail(workflow_id: str, db: Session = Depends(get_db)):
    """Get workflow details including tasks."""
    wf = get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.get("/{workflow_id}/status", response_model=WorkflowStatusResponse)
def get_workflow_status(workflow_id: str, db: Session = Depends(get_db)):
    """Get workflow execution status summary."""
    wf = get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    tasks = list_workflow_tasks(db, workflow_id)
    pending_approvals = (
        db.query(Approval)
        .filter(Approval.workflow_id == workflow_id, Approval.status == "pending")
        .count()
    )

    return WorkflowStatusResponse(
        workflow_id=workflow_id,
        status=wf.status,
        total_tasks=len(tasks),
        completed_tasks=sum(1 for t in tasks if t.status == "completed"),
        failed_tasks=sum(1 for t in tasks if t.status == "failed"),
        pending_tasks=sum(1 for t in tasks if t.status in ("pending", "ready")),
        running_tasks=sum(1 for t in tasks if t.status == "running"),
        pending_approvals=pending_approvals,
    )


@router.post("/{workflow_id}/start")
def start_workflow(
    workflow_id: str,
    simulate_failure: bool = False,
    db: Session = Depends(get_db),
):
    """Start executing a workflow (runs in background thread)."""
    wf = get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if wf.status not in ("pending", "paused"):
        raise HTTPException(
            status_code=400,
            detail=f"Workflow cannot be started from status '{wf.status}'"
        )

    # Run in background thread so API returns immediately
    thread = threading.Thread(
        target=_run_workflow_background,
        args=(workflow_id, wf.objective, wf.execution_mode, simulate_failure),
        daemon=True,
    )
    thread.start()

    return {"message": "Workflow started", "workflow_id": workflow_id, "status": "running"}


@router.post("/{workflow_id}/resume")
def resume_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Resume a paused workflow after approval."""
    wf = get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if wf.status != "paused":
        raise HTTPException(
            status_code=400,
            detail=f"Workflow is not paused (current status: {wf.status})"
        )

    def _resume():
        try:
            from app.orchestration.graph import resume_workflow_graph
            resume_workflow_graph(workflow_id, wf.objective, wf.execution_mode)
        except Exception as e:
            from app.core.database import SessionLocal
            db2 = SessionLocal()
            try:
                update_workflow_status(db2, workflow_id, "failed")
                log_event(db2, workflow_id, "resume_error", "error", error_message=str(e))
            finally:
                db2.close()

    thread = threading.Thread(target=_resume, daemon=True)
    thread.start()

    return {"message": "Workflow resumed", "workflow_id": workflow_id}


@router.post("/{workflow_id}/cancel")
def cancel_workflow_endpoint(workflow_id: str, db: Session = Depends(get_db)):
    """Cancel a workflow."""
    wf = cancel_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"message": "Workflow cancelled", "workflow_id": workflow_id}


@router.get("/{workflow_id}/tasks", response_model=List[TaskResponse])
def get_workflow_tasks(workflow_id: str, db: Session = Depends(get_db)):
    """Get all tasks for a workflow."""
    wf = get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return list_workflow_tasks(db, workflow_id)


@router.get("/{workflow_id}/logs", response_model=List[ExecutionLogResponse])
def get_workflow_logs(
    workflow_id: str,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get execution logs for a workflow."""
    wf = get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    logs = (
        db.query(ExecutionLog)
        .filter(ExecutionLog.workflow_id == workflow_id)
        .order_by(ExecutionLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return logs


@router.get("/{workflow_id}/graph")
def get_workflow_graph_data(workflow_id: str, db: Session = Depends(get_db)):
    """Get workflow graph data for visualization (nodes + edges)."""
    wf = get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    tasks = list_workflow_tasks(db, workflow_id)
    from app.models.entities import TaskDependency

    nodes = []
    edges = []

    for task in tasks:
        nodes.append({
            "id": task.id,
            "type": "taskNode",
            "data": {
                "label": task.name,
                "status": task.status,
                "agent": task.assigned_agent,
                "tool": task.tool_name,
                "requires_approval": task.requires_approval,
                "retry_count": task.retry_count,
                "description": task.description,
            },
            "position": {"x": task.order_index * 250, "y": 100},
        })

    deps = (
        db.query(TaskDependency)
        .join(Task, Task.id == TaskDependency.task_id)
        .filter(Task.workflow_id == workflow_id)
        .all()
    )

    for i, dep in enumerate(deps):
        edges.append({
            "id": f"e-{dep.depends_on_task_id}-{dep.task_id}",
            "source": dep.depends_on_task_id,
            "target": dep.task_id,
            "animated": True,
        })

    return {"nodes": nodes, "edges": edges}
