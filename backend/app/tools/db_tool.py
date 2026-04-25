from sqlalchemy.orm import Session
from models.schema import Project, InventoryItem, SessionLocal, StockStatus
from typing import Optional
import json

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
            result.append({
                "name": item.name,
                "quantity": item.quantity,
                "unit": item.unit,
                "status": item.status.value,
                "min_threshold": item.min_threshold
            })
        return json.dumps(result, indent=2)
    finally:
        db.close()

def db_update_inventory(item_name: str, new_quantity: float) -> str:
    db: Session = SessionLocal()
    try:
        item = db.query(InventoryItem).filter(
            InventoryItem.name.ilike(f"%{item_name}%")
        ).first()
        if not item:
            return f"Item '{item_name}' not found in inventory."
        
        item.quantity = new_quantity
        # Auto-update status
        ratio = new_quantity / max(item.min_threshold, 1)
        if ratio <= 0.3:
            item.status = StockStatus.critical
        elif ratio <= 0.8:
            item.status = StockStatus.low
        else:
            item.status = StockStatus.ok
        
        db.commit()
        return f"Updated {item.name}: {new_quantity} {item.unit} — status: {item.status.value}"
    finally:
        db.close()

def db_query_projects(status_filter: Optional[str] = None) -> str:
    db: Session = SessionLocal()
    try:
        query = db.query(Project)
        if status_filter:
            query = query.filter(Project.status == status_filter)
        projects = query.all()
        result = [{"id": p.id, "name": p.name, "status": p.status.value, 
                   "progress": p.progress, "owner": p.owner} for p in projects]
        return json.dumps(result, indent=2)
    finally:
        db.close()