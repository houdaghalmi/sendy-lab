from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.schema import get_db, InventoryItem
from app.services.notification_service import create_notification
from typing import Optional

router = APIRouter()


class ItemCreate(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str
    min_required: int = 0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    min_required: Optional[int] = None


@router.get("/")
def list_inventory(db: Session = Depends(get_db)):
    return db.query(InventoryItem).order_by(InventoryItem.last_updated.desc(), InventoryItem.id.desc()).all()


@router.post("/")
def add_item(data: ItemCreate, db: Session = Depends(get_db)):
    item = InventoryItem(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    create_notification(db, f'Inventory item "{item.name}" was created.', "success")
    db.commit()
    return item


@router.get("/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}")
def update_item(item_id: int, data: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    create_notification(db, f'Inventory item "{item.name}" was updated.', "info")
    db.commit()
    return item


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item_name = item.name
    db.delete(item)
    db.commit()
    create_notification(db, f'Inventory item "{item_name}" was deleted.', "warning")
    db.commit()
    return {"deleted": item_id}