from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.schema import Notification, get_db

router = APIRouter()


class NotificationCreate(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    level: Optional[str] = Field(default="info", pattern="^(info|warning|error|success)$")


@router.get("/")
def list_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()


@router.post("/")
def create_notification_endpoint(data: NotificationCreate, db: Session = Depends(get_db)):
    notification = Notification(message=data.message.strip(), level=data.level or "info")
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/{notification_id}/read")
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
