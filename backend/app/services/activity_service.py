from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.schema import AIActionLog


def create_activity(
    db: Session,
    action_type: str,
    description: str,
    metadata: Optional[dict[str, Any]] = None,
) -> AIActionLog:
    activity = AIActionLog(
        action_type=(action_type or "general").strip()[:80],
        description=(description or "").strip()[:500],
        metadata_json=metadata or {},
    )
    db.add(activity)
    db.flush()
    return activity


def log_activity(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    entity_name: str,
    source: str,
    project_id: Optional[int] = None,
    project_name: Optional[str] = None,
    extra_metadata: Optional[dict[str, Any]] = None,
) -> AIActionLog:
    action_value = (action or "unknown").strip().lower()
    entity_value = (entity_type or "entity").strip().lower()
    safe_name = (entity_name or entity_type or "item").strip()
    verb = {"create": "created", "update": "updated", "delete": "deleted"}.get(action_value, action_value)

    description = f'{entity_value.title()} "{safe_name}" was {verb}.'
    metadata: dict[str, Any] = {
        "action": action_value,
        "entity_type": entity_value,
        "entity_id": entity_id,
        "entity_name": safe_name,
        "source": source,
    }
    if project_id is not None:
        metadata["project_id"] = project_id
    if project_name:
        metadata["project_name"] = project_name
    if extra_metadata:
        metadata.update(extra_metadata)

    return create_activity(
        db,
        action_type=f"{entity_value}_{action_value}",
        description=description,
        metadata=metadata,
    )


def log_project_created(db: Session, project_id: int, project_name: str, source: str) -> AIActionLog:
    return log_activity(
        db,
        action="create",
        entity_type="project",
        entity_id=project_id,
        entity_name=project_name,
        source=source,
        project_id=project_id,
        project_name=project_name,
    )
