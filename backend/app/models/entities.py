"""
SQLAlchemy ORM Models for VYUHAM
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def now_utc():
    return datetime.utcnow()


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    objective = Column(Text, nullable=False)
    status = Column(
        String(20), nullable=False, default="pending",
        index=True
        # values: pending, planning, running, paused, completed, failed, cancelled
    )
    execution_mode = Column(String(10), nullable=False, default="demo")
    created_at = Column(DateTime, nullable=False, default=now_utc)
    updated_at = Column(DateTime, nullable=False, default=now_utc, onupdate=now_utc)

    # Relationships
    tasks = relationship("Task", back_populates="workflow", cascade="all, delete-orphan")
    logs = relationship("ExecutionLog", back_populates="workflow", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_workflows_status_created", "status", "created_at"),
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_agent = Column(String(100), nullable=True)
    tool_name = Column(String(100), nullable=True)
    tool_input = Column(Text, nullable=True)   # JSON string
    tool_output = Column(Text, nullable=True)  # JSON string
    status = Column(
        String(20), nullable=False, default="pending", index=True
        # values: pending, ready, running, completed, failed, blocked, skipped, awaiting_approval
    )
    requires_approval = Column(Boolean, nullable=False, default=False)
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    error_message = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=now_utc)
    updated_at = Column(DateTime, nullable=False, default=now_utc, onupdate=now_utc)

    # Relationships
    workflow = relationship("Workflow", back_populates="tasks")
    logs = relationship("ExecutionLog", back_populates="task", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="task", cascade="all, delete-orphan")

    # Dependencies: tasks this task depends on
    dependencies = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="task",
        cascade="all, delete-orphan",
    )
    # Dependents: tasks that depend on this task
    dependents = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.depends_on_task_id",
        back_populates="depends_on_task",
    )


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    depends_on_task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    task = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on_task = relationship("Task", foreign_keys=[depends_on_task_id], back_populates="dependents")

    __table_args__ = (
        Index("ix_task_dependency_unique", "task_id", "depends_on_task_id", unique=True),
    )


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(
        String(20), nullable=False, default="pending", index=True
        # values: pending, approved, rejected
    )
    requested_by = Column(String(100), nullable=False, default="system")
    decided_by = Column(String(100), nullable=True)
    decision_reason = Column(Text, nullable=True)
    action_description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=now_utc)
    decided_at = Column(DateTime, nullable=True)

    # Relationships
    task = relationship("Task", back_populates="approvals")


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    agent_name = Column(String(100), nullable=True)
    action = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="info")
    # values: info, success, warning, error, retry, approval_request, approval_decision
    attempt_number = Column(Integer, nullable=False, default=1)
    input_data = Column(Text, nullable=True)   # JSON string
    output_data = Column(Text, nullable=True)  # JSON string
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=now_utc)

    # Relationships
    workflow = relationship("Workflow", back_populates="logs")
    task = relationship("Task", back_populates="logs")

    __table_args__ = (
        Index("ix_exec_logs_workflow_created", "workflow_id", "created_at"),
    )


# Business data tables (simulated for hackathon)
class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    role = Column(String(100), nullable=True)
    manager = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=now_utc)
    created_by_workflow = Column(String(36), nullable=True)


class EmailRecord(Base):
    __tablename__ = "email_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="prepared")
    # values: prepared, sent, cancelled
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=now_utc)
    created_by_workflow = Column(String(36), nullable=True)


class TrainingAssignment(Base):
    __tablename__ = "training_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=True)
    employee_name = Column(String(255), nullable=False)
    training_name = Column(String(255), nullable=False)
    training_type = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="assigned")
    # values: assigned, in_progress, completed
    assigned_at = Column(DateTime, nullable=False, default=now_utc)
    created_by_workflow = Column(String(36), nullable=True)
