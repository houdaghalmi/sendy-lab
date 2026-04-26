from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.schema import get_db, InventoryItem

router = APIRouter()

class ItemCreate(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str
    min_required: int = 0

@router.get("/")
def list_inventory(db: Session = Depends(get_db)):
    return db.query(InventoryItem).all()

@router.post("/")
def add_item(data: ItemCreate, db: Session = Depends(get_db)):
    item = InventoryItem(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.patch("/{item_id}")
def update_item(item_id: int, data: dict, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in data.items():
        setattr(item, k, v)
    db.commit()
    return item