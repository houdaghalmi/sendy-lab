from sqlalchemy import create_engine, Column, String, Integer, Float, Text, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum
from config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class ProjectStatus(str, enum.Enum):
    research = "research"
    experiment = "experiment"
    complete = "complete"

class StockStatus(str, enum.Enum):
    ok = "ok"
    low = "low"
    critical = "critical"

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.research)
    progress = Column(Integer, default=0)  # 0-100
    owner = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

class InventoryItem(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    quantity = Column(Float, nullable=False)
    unit = Column(String(50))
    min_threshold = Column(Float, default=5.0)
    status = Column(Enum(StockStatus), default=StockStatus.ok)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)