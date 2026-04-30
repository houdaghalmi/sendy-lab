from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    CheckConstraint,
    JSON,
    inspect,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError
from app.config import settings

def _build_engine():
    db_url = settings.DATABASE_URL
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine = create_engine(db_url, connect_args=connect_args)
    try:
        with engine.connect():
            pass
        return engine
    except OperationalError:
        if db_url.startswith("sqlite"):
            raise
        raise RuntimeError(
            "Failed to connect to configured PostgreSQL database. "
            "SQLite fallback is disabled to avoid data inconsistency."
        )


def _sync_sqlite_schema():
    if not engine.url.get_backend_name().startswith("sqlite"):
        return

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        if "projects" in tables:
            project_columns = {column["name"] for column in inspector.get_columns("projects")}
            if "priority" not in project_columns:
                conn.execute(text("ALTER TABLE projects ADD COLUMN priority INTEGER DEFAULT 1"))
                conn.execute(text("UPDATE projects SET priority = COALESCE(priority, 1)"))

        if "inventory" in tables:
            inventory_columns = {column["name"] for column in inspector.get_columns("inventory")}
            if "min_required" not in inventory_columns:
                conn.execute(text("ALTER TABLE inventory ADD COLUMN min_required INTEGER DEFAULT 0"))
                conn.execute(text("UPDATE inventory SET min_required = COALESCE(min_required, 0)"))
            if "last_updated" not in inventory_columns:
                conn.execute(text("ALTER TABLE inventory ADD COLUMN last_updated DATETIME"))
                if "updated_at" in inventory_columns:
                    conn.execute(
                        text(
                            "UPDATE inventory SET last_updated = updated_at "
                            "WHERE last_updated IS NULL AND updated_at IS NOT NULL"
                        )
                    )
                conn.execute(text("UPDATE inventory SET last_updated = CURRENT_TIMESTAMP WHERE last_updated IS NULL"))


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
JSON_COLUMN_TYPE = JSON if engine.url.get_backend_name().startswith("sqlite") else JSONB

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    description = Column(Text)
    status = Column(String(20), nullable=False, default="planned", server_default="planned")
    priority = Column(Integer, nullable=False, default=1, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('planned', 'ongoing', 'completed')", name="projects_status_check"),
    )


class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    category = Column(Text)
    quantity = Column(Integer, nullable=False, default=0, server_default="0")
    unit = Column(Text)
    min_required = Column(Integer, nullable=False, default=0, server_default="0")
    last_updated = Column(DateTime, nullable=False, default=func.now(), server_default=func.now(), onupdate=func.now())


class ProjectRequirement(Base):
    __tablename__ = "project_requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False)
    required_quantity = Column(Integer, nullable=False)


class ExperimentLog(Base):
    __tablename__ = "experiments_log"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    result = Column(Text)
    success = Column(Boolean)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class AIActionLog(Base):
    __tablename__ = "ai_actions_log"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(Text)
    description = Column(Text)
    metadata_json = Column("metadata", JSON_COLUMN_TYPE)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class ResearchCache(Base):
    __tablename__ = "research_cache"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(Text)
    summary = Column(Text)
    source = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False)
    change_amount = Column(Integer)
    reason = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task = Column(Text)
    status = Column(String(20), nullable=False, default="pending", server_default="pending")
    result = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'running', 'completed', 'failed')", name="agent_tasks_status_check"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    level = Column(String(20), nullable=False, default="info", server_default="info")
    is_read = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("level IN ('info', 'warning', 'error', 'success')", name="notifications_level_check"),
    )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
    _sync_sqlite_schema()