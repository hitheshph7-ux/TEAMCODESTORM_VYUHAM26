"""
Training business tools (simulated)
"""
import random
from typing import Optional
from sqlalchemy.orm import Session

from app.models.entities import TrainingAssignment, Employee

# Demo failure simulation counter (for hackathon demo)
_failure_counters: dict = {}


def assign_training(
    db: Session,
    employee_name: str,
    training_name: str,
    training_type: Optional[str] = None,
    workflow_id: Optional[str] = None,
    simulate_failure: bool = False,
    task_id: Optional[str] = None,
) -> dict:
    """Assign a training course to an employee."""
    # Demo failure simulation: fail first attempt, succeed on retry
    if simulate_failure and task_id:
        counter = _failure_counters.get(task_id, 0)
        if counter < 2:  # Fail first 2 attempts
            _failure_counters[task_id] = counter + 1
            raise RuntimeError(
                f"Training assignment failed (attempt {counter + 1}): "
                "Connection to training portal timed out. Will retry."
            )
        else:
            _failure_counters.pop(task_id, None)  # Reset for next run

    # Find employee
    employee = db.query(Employee).filter(Employee.name == employee_name).first()

    assignment = TrainingAssignment(
        employee_id=employee.id if employee else None,
        employee_name=employee_name,
        training_name=training_name,
        training_type=training_type or "mandatory",
        status="assigned",
        created_by_workflow=workflow_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "success": True,
        "assignment_id": assignment.id,
        "employee_name": employee_name,
        "training_name": training_name,
        "training_type": training_type or "mandatory",
        "status": "assigned",
        "message": f"Training '{training_name}' assigned to {employee_name}",
    }


def get_training_status(
    db: Session,
    assignment_id: Optional[str] = None,
    employee_name: Optional[str] = None,
) -> dict:
    """Get training assignment status."""
    assignment = None
    if assignment_id:
        assignment = db.query(TrainingAssignment).filter(TrainingAssignment.id == assignment_id).first()
    elif employee_name:
        assignment = (
            db.query(TrainingAssignment)
            .filter(TrainingAssignment.employee_name == employee_name)
            .order_by(TrainingAssignment.assigned_at.desc())
            .first()
        )

    if not assignment:
        return {"success": False, "message": "Training assignment not found"}

    return {
        "success": True,
        "assignment_id": assignment.id,
        "employee_name": assignment.employee_name,
        "training_name": assignment.training_name,
        "status": assignment.status,
    }
