from sqlalchemy.orm import Session
from app.models.schema import Project, InventoryItem, SessionLocal
from typing import Optional
import json


VALID_PROJECT_STATUSES = {"planned", "ongoing", "completed"}


def _coerce_int(value: object, default: int = 0) -> int:
    try:
        return default if value is None else int(value)
    except (TypeError, ValueError):
        return default

def db_query_inventory(item_name: Optional[str] = None) -> str:
    db: Session = SessionLocal()
    try:
        if item_name:
            items = db.query(InventoryItem).filter(
                InventoryItem.name.ilike(f"%{item_name}%")
            ).all()
        else:
            items = db.query(InventoryItem).all()
        
        result = []
        for item in items:
            quantity = _coerce_int(getattr(item, "quantity", 0), 0)
            min_required = _coerce_int(getattr(item, "min_required", 0), 0)
            stock_state = "ok" if quantity >= min_required else "low"
            result.append({
                "name": item.name,
                "quantity": quantity,
                "unit": item.unit,
                "min_required": min_required,
                "stock_state": stock_state,
            })
        return json.dumps(result, indent=2)
    finally:
        db.close()

def db_update_inventory(item_name: str, new_quantity: int) -> str:
    db: Session = SessionLocal()
    try:
        item = db.query(InventoryItem).filter(
            InventoryItem.name.ilike(f"%{item_name}%")
        ).first()
        if not item:
            return f"Item '{item_name}' not found in inventory."
        
        item.quantity = new_quantity
        db.commit()
        min_required = _coerce_int(getattr(item, "min_required", 0), 0)
        stock_state = "ok" if _coerce_int(item.quantity, 0) >= min_required else "low"
        return f"Updated {item.name}: {new_quantity} {item.unit} - stock_state: {stock_state}"
    finally:
        db.close()

def db_query_projects(status_filter: Optional[str] = None) -> str:
    db: Session = SessionLocal()
    try:
        query = db.query(Project)
        if status_filter:
            query = query.filter(Project.status == status_filter)
        projects = query.all()
        result = [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "status": p.status,
                "priority": _coerce_int(getattr(p, "priority", 1), 1),
            }
            for p in projects
        ]
        return json.dumps(result, indent=2)
    finally:
        db.close()


def db_create_project(name: str, description: str = "", status: str = "planned", priority: int = 1) -> str:
    safe_status = status if status in VALID_PROJECT_STATUSES else "planned"
    safe_priority = max(1, min(5, int(priority)))

    db: Session = SessionLocal()
    try:
        project = Project(
            name=name.strip()[:120],
            description=(description or "").strip()[:500],
            status=safe_status,
            priority=safe_priority,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return (
            f"Created project #{project.id}: {project.name} "
            f"(status={project.status}, priority={project.priority})."
        )
    finally:
        db.close()


def db_update_project_status(project_name: str, status: str) -> str:
    safe_status = status.strip().lower()
    if safe_status not in VALID_PROJECT_STATUSES:
        allowed = ", ".join(sorted(VALID_PROJECT_STATUSES))
        return f"Invalid status '{status}'. Allowed: {allowed}."

    db: Session = SessionLocal()
    try:
        project = (
            db.query(Project)
            .filter(Project.name.ilike(f"%{project_name}%"))
            .order_by(Project.created_at.desc())
            .first()
        )
        if not project:
            return f"Project '{project_name}' not found."

        project.status = safe_status
        db.commit()
        return f"Updated project '{project.name}' to status '{project.status}'."
    finally:
        db.close()


def db_delete_project(project_name: str) -> str:
    db: Session = SessionLocal()
    try:
        project = (
            db.query(Project)
            .filter(Project.name.ilike(f"%{project_name}%"))
            .order_by(Project.created_at.desc())
            .first()
        )
        if not project:
            return f"Project '{project_name}' not found."

        project_label = project.name
        db.delete(project)
        db.commit()
        return f"Deleted project '{project_label}'."
    finally:
        db.close()


def db_delete_all_projects() -> str:
    db: Session = SessionLocal()
    try:
        projects = db.query(Project).all()
        if not projects:
            return "No projects found to delete."

        names = [p.name for p in projects]
        for project in projects:
            db.delete(project)
        db.commit()
        return f"Deleted {len(names)} project(s): {', '.join(names)}."
    finally:
        db.close()