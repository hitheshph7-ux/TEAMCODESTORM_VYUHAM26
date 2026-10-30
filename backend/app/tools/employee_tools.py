"""
Employee business tools (simulated, stored in SQLite)
"""
import json
from typing import Optional
from sqlalchemy.orm import Session

from app.models.entities import Employee


def create_employee(
    db: Session,
    name: str,
    email: Optional[str] = None,
    department: Optional[str] = None,
    role: Optional[str] = None,
    manager: Optional[str] = None,
    workflow_id: Optional[str] = None,
) -> dict:
    """Create a new employee record."""
    if not name or not name.strip():
        raise ValueError("Employee name is required")

    # Check for duplicate
    existing = db.query(Employee).filter(Employee.name == name).first()
    if existing:
        return {
            "success": True,
            "employee_id": existing.id,
            "name": existing.name,
            "message": f"Employee '{name}' already exists",
            "is_existing": True,
        }

    emp = Employee(
        name=name.strip(),
        email=email or f"{name.lower().replace(' ', '.')}@company.com",
        department=department or "General",
        role=role or "Employee",
        manager=manager or "HR Department",
        created_by_workflow=workflow_id,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    return {
        "success": True,
        "employee_id": emp.id,
        "name": emp.name,
        "email": emp.email,
        "department": emp.department,
        "role": emp.role,
        "manager": emp.manager,
        "message": f"Employee '{name}' created successfully",
        "is_existing": False,
    }


def get_employee(db: Session, employee_id: Optional[str] = None, name: Optional[str] = None) -> dict:
    """Retrieve an employee by ID or name."""
    emp = None
    if employee_id:
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
    elif name:
        emp = db.query(Employee).filter(Employee.name == name).first()

    if not emp:
        return {"success": False, "message": "Employee not found"}

    return {
        "success": True,
        "employee_id": emp.id,
        "name": emp.name,
        "email": emp.email,
        "department": emp.department,
        "role": emp.role,
        "manager": emp.manager,
    }
