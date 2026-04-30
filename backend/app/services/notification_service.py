from sqlalchemy.orm import Session

from app.models.schema import Notification


def create_notification(db: Session, message: str, level: str = "info") -> Notification:
    notification = Notification(message=message, level=level)
    db.add(notification)
    db.flush()
    return notification
