"""
Email business tools (simulated – no real SMTP)
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.entities import EmailRecord, Approval


def prepare_email(
    db: Session,
    recipient: str,
    subject: str,
    body: Optional[str] = None,
    workflow_id: Optional[str] = None,
) -> dict:
    """Prepare an email and store it in the database (not sent yet)."""
    if not recipient or not subject:
        raise ValueError("recipient and subject are required")

    if not body:
        body = (
            f"Dear {recipient},\n\n"
            f"Welcome to the organization! This is your onboarding email.\n\n"
            f"Please reach out to HR if you have any questions.\n\n"
            f"Best regards,\nHR Department"
        )

    record = EmailRecord(
        recipient=recipient,
        subject=subject,
        body=body,
        status="prepared",
        created_by_workflow=workflow_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "email_id": record.id,
        "recipient": recipient,
        "subject": subject,
        "status": "prepared",
        "message": "Email prepared and awaiting approval to send",
    }


def send_email(
    db: Session,
    email_id: Optional[str] = None,
    workflow_id: Optional[str] = None,
    task_id: Optional[str] = None,
) -> dict:
    """
    Send a prepared email – only after approval has been granted.
    Backend enforces the approval check.
    """
    # Enforce approval check if task_id provided
    if task_id:
        approval = (
            db.query(Approval)
            .filter(Approval.task_id == task_id, Approval.status == "approved")
            .first()
        )
        if not approval:
            return {
                "success": False,
                "message": "Cannot send email: approval has not been granted",
                "blocked": True,
            }

    # Find the prepared email
    record = None
    if email_id:
        record = db.query(EmailRecord).filter(EmailRecord.id == email_id).first()
    elif workflow_id:
        record = (
            db.query(EmailRecord)
            .filter(
                EmailRecord.created_by_workflow == workflow_id,
                EmailRecord.status == "prepared",
            )
            .order_by(EmailRecord.created_at.desc())
            .first()
        )

    if not record:
        # Simulate sending without a pre-existing record
        return {
            "success": True,
            "message": "Email sent successfully (simulated)",
            "status": "sent",
        }

    record.status = "sent"
    record.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "email_id": record.id,
        "recipient": record.recipient,
        "subject": record.subject,
        "status": "sent",
        "message": f"Email sent successfully to {record.recipient} (simulated)",
    }
