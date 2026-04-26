from sqlalchemy.orm import Session
from app.models.schema import Project, InventoryItem, ProjectRequirement, SessionLocal
from typing import Any, Dict, Optional
import json


VALID_PROJECT_STATUSES = {"planned", "ongoing", "completed"}

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
            stock_state = "ok" if item.quantity >= item.min_required else "low"
            result.append({
                "name": item.name,
                "quantity": item.quantity,
                "unit": item.unit,
                "min_required": item.min_required,
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
        stock_state = "ok" if item.quantity >= item.min_required else "low"
        return f"Updated {item.name}: {new_quantity} {item.unit} - stock_state: {stock_state}"
    finally:
        db.close()


def db_add_inventory_item(
    item_name: str,
    quantity: int,
    unit: Optional[str] = None,
    category: str = "General",
    min_required: int = 0,
) -> str:
    safe_name = (item_name or "").strip()[:120]
    if not safe_name:
        return "Inventory item name is required."
    safe_quantity = max(0, int(quantity))
    safe_unit = (unit or "units").strip()[:30] or "units"
    safe_category = (category or "General").strip()[:60] or "General"
    safe_min_required = max(0, int(min_required))

    db: Session = SessionLocal()
    try:
        existing = (
            db.query(InventoryItem)
            .filter(InventoryItem.name.ilike(safe_name))
            .order_by(InventoryItem.id.desc())
            .first()
        )
        if existing:
            existing_unit = (existing.unit or "").strip().lower()
            if existing_unit and safe_unit.lower() != existing_unit:
                return (
                    f"Unit mismatch for '{existing.name}': existing unit is '{existing.unit}', "
                    f"received '{safe_unit}'. Please update using the same unit."
                )
            existing.quantity = int(existing.quantity or 0) + safe_quantity
            if safe_min_required > 0:
                existing.min_required = safe_min_required
            if safe_category and (not existing.category or existing.category == "General"):
                existing.category = safe_category
            db.commit()
            stock_state = "ok" if existing.quantity >= existing.min_required else "low"
            return (
                f"Added {safe_quantity} {existing.unit or safe_unit} to {existing.name}. "
                f"Current quantity: {existing.quantity} {existing.unit or safe_unit} - stock_state: {stock_state}"
            )

        item = InventoryItem(
            name=safe_name,
            category=safe_category,
            quantity=safe_quantity,
            unit=safe_unit,
            min_required=safe_min_required,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        stock_state = "ok" if item.quantity >= item.min_required else "low"
        return (
            f"Added new inventory item '{item.name}': {item.quantity} {item.unit} "
            f"(min_required={item.min_required}, stock_state={stock_state})."
        )
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
                "priority": p.priority,
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


def db_check_project_feasibility(project_name_or_id: object) -> Dict[str, Any]:
    db: Session = SessionLocal()
    try:
        project = None
        if isinstance(project_name_or_id, int):
            project = db.query(Project).filter(Project.id == project_name_or_id).first()
        else:
            lookup = str(project_name_or_id or "").strip()
            if lookup.isdigit():
                project = db.query(Project).filter(Project.id == int(lookup)).first()
            if not project and lookup:
                project = (
                    db.query(Project)
                    .filter(Project.name.ilike(f"%{lookup}%"))
                    .order_by(Project.created_at.desc())
                    .first()
                )

        if not project:
            return {
                "project_id": None,
                "project_name": str(project_name_or_id),
                "feasibility_status": "NOT_FOUND",
                "message": "Project not found.",
                "required_items": [],
                "missing_items": [],
                "risky_items": [],
                "suggested_action": "Create or select an existing project first.",
            }

        requirements = (
            db.query(ProjectRequirement, InventoryItem)
            .join(InventoryItem, ProjectRequirement.inventory_id == InventoryItem.id)
            .filter(ProjectRequirement.project_id == project.id)
            .all()
        )

        if not requirements:
            return {
                "project_id": project.id,
                "project_name": project.name,
                "project_status": project.status,
                "project_priority": project.priority,
                "feasibility_status": "NO_REQUIREMENTS",
                "message": "Project has no required materials defined.",
                "required_items": [],
                "missing_items": [],
                "risky_items": [],
                "suggested_action": "Add project material requirements before running feasibility.",
            }

        required_items = []
        missing_items = []
        risky_items = []

        for req, item in requirements:
            available = int(item.quantity or 0)
            needed = int(req.required_quantity or 0)
            min_required = int(item.min_required or 0)
            remaining = available - needed
            unit = item.unit or "units"

            required_items.append(
                {
                    "inventory_id": item.id,
                    "item_name": item.name,
                    "available_quantity": available,
                    "required_quantity": needed,
                    "unit": unit,
                }
            )

            if available < needed:
                missing_items.append(
                    {
                        "inventory_id": item.id,
                        "item_name": item.name,
                        "available_quantity": available,
                        "required_quantity": needed,
                        "missing_quantity": needed - available,
                        "unit": unit,
                    }
                )
            elif remaining < min_required:
                risky_items.append(
                    {
                        "inventory_id": item.id,
                        "item_name": item.name,
                        "remaining_after_use": remaining,
                        "min_required_in_stock": min_required,
                        "unit": unit,
                    }
                )

        if missing_items:
            status = "NOT_FEASIBLE"
            suggestion = "Restock missing materials before starting this project."
        elif risky_items:
            status = "RISKY"
            suggestion = "Project can proceed, but inventory will drop below minimum levels. Plan restocking."
        else:
            status = "FEASIBLE"
            suggestion = "All required materials are available at safe stock levels."

        return {
            "project_id": project.id,
            "project_name": project.name,
            "project_status": project.status,
            "project_priority": project.priority,
            "feasibility_status": status,
            "required_items": required_items,
            "missing_items": missing_items,
            "risky_items": risky_items,
            "suggested_action": suggestion,
        }
    finally:
        db.close()