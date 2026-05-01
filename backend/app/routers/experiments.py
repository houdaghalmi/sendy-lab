from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.schema import ExperimentLog, Project, get_db
from app.services.notification_service import create_notification
from app.services.activity_service import log_activity

router = APIRouter()


class ExperimentCreate(BaseModel):
    project_id: Optional[int] = None
    result: Optional[str] = ""
    success: Optional[bool] = None
    notes: Optional[str] = ""


class ExperimentUpdate(BaseModel):
    project_id: Optional[int] = Field(default=None)
    result: Optional[str] = None
    success: Optional[bool] = None
    notes: Optional[str] = None


@router.get("/")
def list_experiments(db: Session = Depends(get_db)):
    return db.query(ExperimentLog).order_by(ExperimentLog.created_at.desc(), ExperimentLog.id.desc()).all()


@router.post("/")
def create_experiment(data: ExperimentCreate, db: Session = Depends(get_db)):
    project = None
    if data.project_id is not None:
        project = db.query(Project).filter(Project.id == data.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    experiment = ExperimentLog(**data.dict())
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    log_activity(
        db,
        action="create",
        entity_type="experiment",
        entity_id=experiment.id,
        entity_name=f"Experiment #{experiment.id}",
        source="experiments_api",
        project_id=experiment.project_id,
        project_name=(project.name if project else None),
    )
    create_notification(db, f"Experiment #{experiment.id} was created.", "success")
    db.commit()
    return experiment


@router.get("/{experiment_id}")
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    experiment = db.query(ExperimentLog).filter(ExperimentLog.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment


@router.get("/project/{project_id}")
def list_experiments_by_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(ExperimentLog).filter(ExperimentLog.project_id == project_id).all()


@router.patch("/{experiment_id}")
def update_experiment(experiment_id: int, data: ExperimentUpdate, db: Session = Depends(get_db)):
    experiment = db.query(ExperimentLog).filter(ExperimentLog.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    updates = data.dict(exclude_unset=True)
    if "project_id" in updates and updates["project_id"] is not None:
        project = db.query(Project).filter(Project.id == updates["project_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    for key, value in updates.items():
        setattr(experiment, key, value)
    db.commit()
    db.refresh(experiment)
    project = None
    if experiment.project_id is not None:
        project = db.query(Project).filter(Project.id == experiment.project_id).first()
    log_activity(
        db,
        action="update",
        entity_type="experiment",
        entity_id=experiment.id,
        entity_name=f"Experiment #{experiment.id}",
        source="experiments_api",
        project_id=experiment.project_id,
        project_name=(project.name if project else None),
    )
    create_notification(db, f"Experiment #{experiment.id} was updated.", "info")
    db.commit()
    return experiment


@router.delete("/{experiment_id}")
def delete_experiment(experiment_id: int, db: Session = Depends(get_db)):
    experiment = db.query(ExperimentLog).filter(ExperimentLog.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    project = None
    if experiment.project_id is not None:
        project = db.query(Project).filter(Project.id == experiment.project_id).first()
    db.delete(experiment)
    db.commit()
    log_activity(
        db,
        action="delete",
        entity_type="experiment",
        entity_id=experiment_id,
        entity_name=f"Experiment #{experiment_id}",
        source="experiments_api",
        project_id=experiment.project_id,
        project_name=(project.name if project else None),
    )
    create_notification(db, f"Experiment #{experiment_id} was deleted.", "warning")
    db.commit()
    return {"deleted": experiment_id}
