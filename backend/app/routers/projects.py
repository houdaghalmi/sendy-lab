from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.schema import InventoryItem, Project, ProjectRequirement, get_db
from app.services.notification_service import create_notification
from app.services.feasibility_service import check_project_feasibility

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = ""
    status: Optional[str] = Field(default="planned", pattern="^(planned|ongoing|completed)$")
    priority: Optional[int] = Field(default=1, ge=1, le=10)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(planned|ongoing|completed)$")
    priority: Optional[int] = Field(default=None, ge=1, le=10)


class RequirementCreate(BaseModel):
    inventory_id: int
    required_quantity: int = Field(gt=0)


class RequirementUpdate(BaseModel):
    inventory_id: Optional[int] = None
    required_quantity: Optional[int] = Field(default=None, gt=0)


@router.get("/")
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.created_at.desc(), Project.id.desc()).all()


@router.post("/")
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(
        name=data.name.strip(),
        description=(data.description or "").strip(),
        status=data.status or "planned",
        priority=data.priority or 1,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    create_notification(db, f'Project "{proj.name}" was created.', "success")
    db.commit()
    return proj


@router.get("/{proj_id}")
def get_project(proj_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == proj_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{proj_id}")
def update_project(proj_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == proj_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = data.dict(exclude_unset=True)
    for key, value in updates.items():
        if key == "name" and isinstance(value, str):
            value = value.strip()
        if key == "description" and isinstance(value, str):
            value = value.strip()
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    create_notification(db, f'Project "{project.name}" was updated.', "info")
    db.commit()
    return project


@router.delete("/{proj_id}")
def delete_project(proj_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == proj_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Not found")
    project_name = project.name
    db.delete(project)
    db.commit()
    create_notification(db, f'Project "{project_name}" was deleted.', "warning")
    db.commit()
    return {"deleted": proj_id}


@router.get("/{proj_id}/requirements")
def list_project_requirements(proj_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == proj_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = (
        db.query(ProjectRequirement, InventoryItem)
        .join(InventoryItem, ProjectRequirement.inventory_id == InventoryItem.id)
        .filter(ProjectRequirement.project_id == proj_id)
        .all()
    )
    return [
        {
            "id": requirement.id,
            "project_id": requirement.project_id,
            "inventory_id": requirement.inventory_id,
            "required_quantity": requirement.required_quantity,
            "item_name": item.name,
            "unit": item.unit,
            "available_quantity": item.quantity,
        }
        for requirement, item in rows
    ]


@router.post("/{proj_id}/requirements")
def create_project_requirement(proj_id: int, data: RequirementCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == proj_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    inventory_item = db.query(InventoryItem).filter(InventoryItem.id == data.inventory_id).first()
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    requirement = (
        db.query(ProjectRequirement)
        .filter(
            ProjectRequirement.project_id == proj_id,
            ProjectRequirement.inventory_id == data.inventory_id,
        )
        .first()
    )
    if requirement:
        requirement.required_quantity = data.required_quantity
    else:
        requirement = ProjectRequirement(
            project_id=proj_id,
            inventory_id=data.inventory_id,
            required_quantity=data.required_quantity,
        )
        db.add(requirement)

    db.commit()
    db.refresh(requirement)
    create_notification(
        db,
        f'Requirement updated for project "{project.name}": {inventory_item.name} ({data.required_quantity} {inventory_item.unit}).',
        "info",
    )
    db.commit()
    return requirement


@router.get("/{proj_id}/requirements/{req_id}")
def get_project_requirement(proj_id: int, req_id: int, db: Session = Depends(get_db)):
    requirement = (
        db.query(ProjectRequirement)
        .filter(ProjectRequirement.project_id == proj_id, ProjectRequirement.id == req_id)
        .first()
    )
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return requirement


@router.patch("/{proj_id}/requirements/{req_id}")
def update_project_requirement(proj_id: int, req_id: int, data: RequirementUpdate, db: Session = Depends(get_db)):
    requirement = (
        db.query(ProjectRequirement)
        .filter(ProjectRequirement.project_id == proj_id, ProjectRequirement.id == req_id)
        .first()
    )
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    updates = data.dict(exclude_unset=True)
    if "inventory_id" in updates:
        inventory_item = db.query(InventoryItem).filter(InventoryItem.id == updates["inventory_id"]).first()
        if not inventory_item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
    for key, value in updates.items():
        setattr(requirement, key, value)

    db.commit()
    db.refresh(requirement)
    create_notification(db, f"Requirement #{req_id} for project #{proj_id} was updated.", "info")
    db.commit()
    return requirement


@router.delete("/{proj_id}/requirements/{req_id}")
def delete_project_requirement(proj_id: int, req_id: int, db: Session = Depends(get_db)):
    requirement = (
        db.query(ProjectRequirement)
        .filter(ProjectRequirement.project_id == proj_id, ProjectRequirement.id == req_id)
        .first()
    )
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    db.delete(requirement)
    db.commit()
    create_notification(db, f"Requirement #{req_id} for project #{proj_id} was deleted.", "warning")
    db.commit()
    return {"deleted": req_id}


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