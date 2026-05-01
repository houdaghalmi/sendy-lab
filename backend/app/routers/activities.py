from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schema import AIActionLog, get_db

router = APIRouter()


@router.get("/")
def list_activities(db: Session = Depends(get_db)):
    return (
        db.query(AIActionLog)
        .order_by(AIActionLog.created_at.desc(), AIActionLog.id.desc())
        .limit(200)
        .all()
    )
