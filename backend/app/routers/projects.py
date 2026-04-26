from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.schema import get_db, Project
from app.services.feasibility_service import check_project_feasibility, get_feasibility_summary

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "planned"
    priority: Optional[int] = 1

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


@router.get("/{proj_id}/feasibility")
def check_project_feasibility_endpoint(proj_id: int, db: Session = Depends(get_db)):
    """
    Check if a project is feasible based on current inventory.
    
    Returns:
    - project_id: Project ID
    - project_name: Project name
    - feasibility_status: FEASIBLE / RISKY / NOT_FEASIBLE
    - required_items: List of all required materials
    - missing_items: List of items with insufficient quantity
    - risky_items: List of items that would fall below minimum stock
    - suggested_action: Recommended action
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == proj_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {proj_id} not found")
    
    feasibility_data = check_project_feasibility(proj_id)
    
    if feasibility_data.get("feasibility_status") == "ERROR":
        raise HTTPException(status_code=500, detail=feasibility_data.get("error", "Failed to check feasibility"))
    
    return feasibility_data