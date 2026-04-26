import re
from typing import Optional

from app.tools.db_tool import (
    db_create_project,
    db_delete_all_projects,
    db_delete_project,
    db_query_projects,
    db_update_project_status,
)

READ_ONLY_ROLES = {"spongebob"}
DELETE_ALLOWED_ROLES = {"sandy"}
WRITE_ALLOWED_ROLES = {"sandy", "squidward"}


def _parse_priority(query: str) -> int:
    text = query.lower()
    if "high priority" in text or "urgent" in text:
        return 1
    if "low priority" in text:
        return 3
    return 2


def _parse_project_create_name(query: str) -> Optional[str]:
    text = query.strip()
    if not re.search(r"\b(add|create|new)\b", text, flags=re.IGNORECASE):
        return None
    if not re.search(r"\b(plan|project|task)\b", text, flags=re.IGNORECASE):
        return None

    for_match = re.search(r"\bfor\s+(.+)$", text, flags=re.IGNORECASE)
    if for_match:
        return for_match.group(1).strip()[:120]

    phrase_match = re.search(r"\b(?:plan|project|task)\b\s*(.*)$", text, flags=re.IGNORECASE)
    if phrase_match and phrase_match.group(1).strip():
        return phrase_match.group(1).strip(" .,:;")[:120]

    return "New lab plan"


def _parse_project_status_update(query: str) -> Optional[tuple[str, str]]:
    status = _extract_status_filter(query)
    if not status:
        return None
    if not re.search(r"\b(update|set|mark|change)\b", query, flags=re.IGNORECASE):
        return None

    name_match = re.search(r"\bproject\s+(.+?)\s+(?:to|as)\s+(planned|ongoing|completed)\b", query, flags=re.IGNORECASE)
    if name_match:
        return name_match.group(1).strip(), name_match.group(2).lower()
    return None


def _parse_project_delete_name(query: str) -> Optional[str]:
    match = re.search(r"\b(?:delete|remove)\s+(?:project\s+)?(.+)$", query, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip(" .,:;")[:120]
    return None


def _wants_delete_all_projects(query: str) -> bool:
    text = query.lower()
    return bool(
        re.search(r"\b(delete|remove)\s+all\b", text)
        and ("project" in text or "plan" in text or "task" in text or text.strip() == "delete all")
    )


def _extract_status_filter(query: str) -> Optional[str]:
    m = re.search(r"\b(planned|ongoing|completed)\b", query, flags=re.IGNORECASE)
    return m.group(1).lower() if m else None


def _deny_if_no_permission(role: str, action: str) -> Optional[str]:
    normalized_role = (role or "sandy").strip().lower()
    if action == "delete" and normalized_role not in DELETE_ALLOWED_ROLES:
        return f"Permission denied: role '{normalized_role}' cannot delete projects."
    if action in {"create", "update"} and normalized_role not in WRITE_ALLOWED_ROLES:
        return f"Permission denied: role '{normalized_role}' cannot modify project records."
    if action == "read" and normalized_role in READ_ONLY_ROLES:
        return None
    return None


def database_node(state: dict) -> dict:
    if "database" not in state.get("active_agents", []) and state.get("intent") != "combined":
        return {"db_result": ""}

    query = (state.get("user_query") or "").strip()
    role = (state.get("role") or "sandy").strip().lower()

    create_name = _parse_project_create_name(query)
    if create_name:
        denied = _deny_if_no_permission(role, "create")
        if denied:
            return {"db_result": denied}
        result = db_create_project(
            name=create_name,
            description=query,
            status="planned",
            priority=_parse_priority(query),
        )
        return {"db_result": result}

    status_update = _parse_project_status_update(query)
    if status_update:
        denied = _deny_if_no_permission(role, "update")
        if denied:
            return {"db_result": denied}
        project_name, status = status_update
        result = db_update_project_status(project_name, status)
        return {"db_result": result}

    if _wants_delete_all_projects(query):
        denied = _deny_if_no_permission(role, "delete")
        if denied:
            return {"db_result": denied}
        result = db_delete_all_projects()
        return {"db_result": result}

    delete_name = _parse_project_delete_name(query)
    if delete_name:
        denied = _deny_if_no_permission(role, "delete")
        if denied:
            return {"db_result": denied}
        result = db_delete_project(delete_name)
        return {"db_result": result}

    status_filter = _extract_status_filter(query)
    result = db_query_projects(status_filter=status_filter)
    return {"db_result": result}
