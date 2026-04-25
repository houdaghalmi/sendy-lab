from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from models.schema import get_db, Project

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "research"
    progress: Optional[int] = 0
    owner: Optional[str] = "Sandy"

@router.get("/")
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

@router.post("/")
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(**data.dict())
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.patch("/{proj_id}")
def update_project(proj_id: int, data: dict, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == proj_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    for k, v in data.items():
        setattr(proj, k, v)
    db.commit()
    return proj

@router.delete("/{proj_id}")
def delete_project(proj_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == proj_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(proj)
    db.commit()
    return {"deleted": proj_id}