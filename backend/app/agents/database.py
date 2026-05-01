import re
from typing import Optional

from app.services.feasibility_service import check_project_feasibility, format_feasibility_for_agent
from app.tools.db_tool import (
    db_add_project_requirement,
    db_create_project,
    db_delete_all_projects,
    db_delete_project,
    db_get_latest_project_name,
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
    if re.search(r"\brequire(?:ment|ments)?\b", text, flags=re.IGNORECASE):
        return None
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


def _extract_labeled_fields(text: str, allowed_labels: set[str]) -> dict[str, str]:
    pattern = re.compile(r"\b([a-zA-Z_]+)\s*[:=]\s*", flags=re.IGNORECASE)
    matches = [m for m in pattern.finditer(text) if m.group(1).lower() in allowed_labels]
    if not matches:
        return {}

    fields: dict[str, str] = {}
    for idx, match in enumerate(matches):
        label = match.group(1).lower()
        value_start = match.end()
        value_end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        raw_value = text[value_start:value_end].strip(" \t\r\n,;")
        if raw_value:
            fields[label] = raw_value
    return fields


def _parse_project_create_payload(query: str) -> Optional[dict]:
    text = (query or "").strip()
    if re.search(r"\brequire(?:ment|ments)?\b", text, flags=re.IGNORECASE):
        return None
    if not re.search(r"\b(add|create|new)\b", text, flags=re.IGNORECASE):
        return None
    if not re.search(r"\b(plan|project|task)\b", text, flags=re.IGNORECASE):
        return None

    fields = _extract_labeled_fields(text, {"name", "description", "desc", "status", "priority"})

    name = (fields.get("name") or "").strip(" .,:;")
    description = (fields.get("description") or fields.get("desc") or "").strip(" .,:;")

    if not name:
        quoted_name = re.search(r"\b(?:project|plan|task)\s*[\"']([^\"']+)[\"']", text, flags=re.IGNORECASE)
        if quoted_name:
            name = quoted_name.group(1).strip(" .,:;")

    if not name:
        explicit_name = re.search(
            r"\b(?:with\s+name|name|named)\s+([a-zA-Z0-9][a-zA-Z0-9\s\-_]{0,119})$",
            text,
            flags=re.IGNORECASE,
        )
        if explicit_name:
            name = explicit_name.group(1).strip(" .,:;")

    if not name:
        fallback_name = _parse_project_create_name(text)
        if fallback_name:
            # Remove trailing field-style fragments if present.
            fallback_name = re.sub(
                r"\b(?:description|desc|status|priority)\b\s*[:=].*$",
                "",
                fallback_name,
                flags=re.IGNORECASE,
            ).strip(" .,:;")
            fallback_name = re.sub(
                r"^(?:with\s+name|name|named)\s+",
                "",
                fallback_name,
                flags=re.IGNORECASE,
            ).strip(" .,:;")
            name = fallback_name

    if not name:
        return None

    status = (fields.get("status") or "planned").strip().lower()
    if status not in {"planned", "ongoing", "completed"}:
        status = "planned"

    priority = _parse_priority(text)
    if fields.get("priority"):
        priority_match = re.search(r"\d+", fields["priority"])
        if priority_match:
            priority = int(priority_match.group())

    return {
        "name": name[:120],
        "description": description[:500],
        "status": status,
        "priority": priority,
    }


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


def _is_delete_all_projects(query: str) -> bool:
    text = (query or "").strip().lower()
    patterns = [
        r"\b(?:delete|remove)\s+all\s+(?:the\s+)?projects\b",
        r"\b(?:delete|remove)\s+projects\b",
        r"\bclear\s+all\s+projects\b",
    ]
    return any(re.search(pattern, text) for pattern in patterns)


def _extract_status_filter(query: str) -> Optional[str]:
    m = re.search(r"\b(planned|ongoing|completed)\b", query, flags=re.IGNORECASE)
    return m.group(1).lower() if m else None


def _parse_project_requirement(query: str) -> Optional[tuple[str, int, str, Optional[str]]]:
    patterns = [
        r"(?:add(?:ed)?|set|update)\s+require(?:ment|ments)?[:\s]*project\s+(?:called\s+)?(.+?)\s+needs?\s+(\d+)\s*(ml|l|g|kg|units?)\s+of\s+(.+)$",
        r"project\s+(?:called\s+)?(.+?)\s+needs?\s+(\d+)\s*(ml|l|g|kg|units?)\s+of\s+(.+)$",
        r"(?:i\s+need|we\s+need)\s+(\d+)\s*(ml|l|g|kg|units?)\s+of\s+(.+?)\s+(?:to|for)\s+(?:my\s+)?project\s+(?:called\s+)?(.+)$",
        r"(?:my\s+)?project\s+(?:called\s+)?(.+?)\s+(?:requires?|needs?)\s+(\d+)\s*(ml|l|g|kg|units?)\s+of\s+(.+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, query, flags=re.IGNORECASE)
        if not match:
            continue
        if pattern.startswith(r"(?:i\s+need|we\s+need)"):
            qty = int(match.group(1))
            unit = match.group(2).lower()
            item_name = match.group(3).strip(" .,:;")
            project_name = match.group(4).strip(" .,:;")
        else:
            project_name = match.group(1).strip(" .,:;")
            qty = int(match.group(2))
            unit = match.group(3).lower()
            item_name = match.group(4).strip(" .,:;")
        if unit == "unit":
            unit = "units"
        return project_name, qty, item_name, unit
    return None


def _parse_project_feasibility_target(query: str) -> Optional[str]:
    text = (query or "").strip()
    if not re.search(
        r"\b(feasibility|feasible|viable|viability|readiness|can\s+i\s+start|can\s+we\s+start|should\s+i\s+start|ready)\b",
        text,
        flags=re.IGNORECASE,
    ):
        return None

    def _clean_target(target: str) -> str:
        cleaned = (target or "").strip(" .,:;!?")
        cleaned = re.sub(r"^(?:project\s+)?(?:called\s+)?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+project$", "", cleaned, flags=re.IGNORECASE).strip(" .,:;")
        return cleaned

    project_match = re.search(r"\bfor\s+(?:project\s+)?(?:called\s+)?(.+)$", text, flags=re.IGNORECASE)
    if project_match:
        target = _clean_target(project_match.group(1))
        if target:
            return target

    start_match = re.search(
        r"\b(?:can\s+i\s+start|can\s+we\s+start|should\s+i\s+start)\s+(.+)$",
        text,
        flags=re.IGNORECASE,
    )
    if start_match:
        target = _clean_target(start_match.group(1))
        if target:
            return target

    readiness_match = re.search(
        r"\b(?:is|can|should)\s+(.+?)\s+project\s+(?:ready|feasible|viable|to\s+start)\b",
        text,
        flags=re.IGNORECASE,
    )
    if readiness_match:
        target = _clean_target(readiness_match.group(1))
        if target:
            return target

    named_readiness_match = re.search(
        r"\b(.+?)\s+project\s+(?:is\s+)?(?:ready|feasible|viable|to\s+start)\b",
        text,
        flags=re.IGNORECASE,
    )
    if named_readiness_match:
        target = _clean_target(named_readiness_match.group(1))
        if target:
            return target

    named_match = re.search(r"\bproject\s+(?:called\s+)?(.+)$", text, flags=re.IGNORECASE)
    if named_match:
        target = _clean_target(named_match.group(1))
        if target:
            return target

    if re.search(r"\b(this|that)\s+project\b", text, flags=re.IGNORECASE):
        latest = db_get_latest_project_name()
        if latest:
            return latest

    if re.search(r"\bproject\b", text, flags=re.IGNORECASE):
        latest = db_get_latest_project_name()
        if latest:
            return latest
    return None


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

    feasibility_target = _parse_project_feasibility_target(query)
    if feasibility_target:
        feasibility_data = check_project_feasibility(feasibility_target)
        return {"db_result": format_feasibility_for_agent(feasibility_data)}

    requirement_data = _parse_project_requirement(query)
    if requirement_data:
        denied = _deny_if_no_permission(role, "update")
        if denied:
            return {"db_result": denied}
        project_name, qty, item_name, unit = requirement_data
        result = db_add_project_requirement(
            project_name=project_name,
            item_name=item_name,
            required_quantity=qty,
            unit=unit,
        )
        return {"db_result": result}

    create_payload = _parse_project_create_payload(query)
    if create_payload:
        denied = _deny_if_no_permission(role, "create")
        if denied:
            return {"db_result": denied}
        result = db_create_project(
            name=create_payload["name"],
            description=create_payload["description"],
            status=create_payload["status"],
            priority=create_payload["priority"],
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

    delete_name = _parse_project_delete_name(query)
    if _is_delete_all_projects(query):
        denied = _deny_if_no_permission(role, "delete")
        if denied:
            return {"db_result": denied}
        result = db_delete_all_projects()
        return {"db_result": result}

    if delete_name:
        denied = _deny_if_no_permission(role, "delete")
        if denied:
            return {"db_result": denied}
        result = db_delete_project(delete_name)
        return {"db_result": result}

    status_filter = _extract_status_filter(query)
    result = db_query_projects(status_filter=status_filter)
    return {"db_result": result}
