import json
import re

from app.tools.db_tool import (
    db_add_inventory_item,
    db_check_project_feasibility,
    db_delete_all_inventory,
    db_get_latest_project_name,
    db_query_inventory,
    db_update_inventory,
)


def _extract_required_materials(query: str) -> list[tuple[str, int]]:
    pattern = r"(\d+)\s*(?:x|units?|ml|l|g|kg)?\s+of\s+([a-zA-Z][a-zA-Z0-9\s\-]{1,60})"
    return [(name.strip(), int(qty)) for qty, name in re.findall(pattern, query, flags=re.IGNORECASE)]


def _normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def _find_inventory_match(material: str, items: list[dict]) -> dict | None:
    normalized_material = _normalize_name(material)
    if not normalized_material:
        return None

    for item in items:
        item_name = _normalize_name(item.get("name", ""))
        if normalized_material == item_name:
            return item

    for item in items:
        item_name = _normalize_name(item.get("name", ""))
        if normalized_material in item_name or item_name in normalized_material:
            return item

    material_tokens = set(normalized_material.split())
    if not material_tokens:
        return None
    for item in items:
        item_tokens = set(_normalize_name(item.get("name", "")).split())
        if material_tokens.issubset(item_tokens):
            return item
    return None


def _build_stock_alerts(items: list[dict]) -> str:
    low_items = [item for item in items if item.get("stock_state") == "low"]
    if not low_items:
        return ""
    alerts = [
        f"- {item['name']}: {item['quantity']} {item.get('unit', '')} (min {item['min_required']})"
        for item in low_items
    ]
    return "Low stock detected:\n" + "\n".join(alerts) + "\nSuggested action: restock low items soon."


def _parse_add_inventory_command(query: str) -> tuple[str, int, str] | None:
    text = (query or "").strip()
    text = (
        text.replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'")
    )

    unit_pattern = r"(ml|l|g|kg|units?)"
    patterns = [
        rf"(?:add|create|insert)\s+(?P<name>[a-zA-Z][a-zA-Z0-9\s\-]{{1,60}}?)\s+to\s+(?:the\s+)?inventory\s+(?P<qty>\d+)\s*(?P<unit>{unit_pattern})\b",
        rf"(?:add|create|insert)\s+(?P<name>[a-zA-Z][a-zA-Z0-9\s\-]{{1,60}}?)\s+(?:with\s+)?(?P<qty>\d+)\s*(?P<unit>{unit_pattern})(?:\s+unit(?:s)?)?\s+(?:to|on|into)\s+(?:the\s+)?inventory\b",
        rf"(?:add|create|insert)\s+[\"'](?P<name>[^\"']{{1,60}})[\"']\s+(?:with\s+)?(?P<qty>\d+)\s*(?P<unit>{unit_pattern})(?:\s+unit(?:s)?)?\s+(?:to|on|into)\s+(?:the\s+)?inventory\b",
        rf"(?:add|create|insert)\s+(?:new\s+)?inventory\s+(?P<name>[a-zA-Z][a-zA-Z0-9\s\-]{{1,60}}?)\s+(?:with\s+)?(?P<qty>\d+)\s*(?P<unit>{unit_pattern})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue
        name = match.group("name").strip(" .,:;")
        qty = int(match.group("qty"))
        unit = match.group("unit").lower()
        if unit == "unit":
            unit = "units"
        return name, qty, unit
    return None


def _is_delete_all_inventory(query: str) -> bool:
    text = (query or "").strip().lower()
    patterns = [
        r"\b(?:delete|remove|clear)\s+all\s+(?:the\s+)?inventory\b",
        r"\b(?:delete|remove|clear)\s+inventory\s+all\b",
        r"\bempty\s+inventory\b",
    ]
    return any(re.search(pattern, text) for pattern in patterns)


def _parse_project_feasibility_target(query: str) -> str | None:
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
        if cleaned.lower() in {"this", "that"}:
            latest = db_get_latest_project_name()
            return latest or ""
        return cleaned

    patterns = [
        r"\bfor\s+(?:project\s+)?(?:called\s+)?(.+)$",
        r"\b(?:can\s+i\s+start|can\s+we\s+start|should\s+i\s+start)\s+(.+)$",
        r"\b(?:is|can|should)\s+(.+?)\s+project\s+(?:ready|feasible|viable|to\s+start)\b",
        r"\b(.+?)\s+project\s+(?:is\s+)?(?:ready|feasible|viable|to\s+start)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue
        target = _clean_target(match.group(1))
        if target:
            return target

    if re.search(r"\b(this|that)\s+project\b", text, flags=re.IGNORECASE) or re.search(
        r"\bproject\b", text, flags=re.IGNORECASE
    ):
        return db_get_latest_project_name()
    return None


def _format_project_inventory_scope(feasibility_data: dict) -> str:
    status = feasibility_data.get("feasibility_status", "UNKNOWN")
    project_name = feasibility_data.get("project_name", "Unknown Project")
    if status in {"NOT_FOUND", "ERROR"}:
        return f"Project inventory scope unavailable: {feasibility_data.get('message') or feasibility_data.get('error', 'Unknown error')}"

    required_items = feasibility_data.get("required_items", [])
    if not required_items:
        return f"Project inventory scope for '{project_name}': no material requirements defined."

    risky_by_id = {item["inventory_id"]: item for item in feasibility_data.get("risky_items", [])}
    missing_by_id = {item["inventory_id"]: item for item in feasibility_data.get("missing_items", [])}

    lines = [f"Project inventory scope for '{project_name}' (required items only):"]
    for item in required_items:
        item_id = item.get("inventory_id")
        name = item.get("item_name")
        available = item.get("available_quantity", 0)
        needed = item.get("required_quantity", 0)
        unit = item.get("unit", "units")
        if item_id in missing_by_id:
            missing = missing_by_id[item_id].get("missing_quantity", 0)
            lines.append(f"- {name}: insufficient ({available} {unit}, needs {needed}, short by {missing})")
        elif item_id in risky_by_id:
            remaining = risky_by_id[item_id].get("remaining_after_use", 0)
            min_req = risky_by_id[item_id].get("min_required_in_stock", 0)
            lines.append(
                f"- {name}: available but risky ({available} {unit}, needs {needed}, remaining {remaining} below min {min_req})"
            )
        else:
            lines.append(f"- {name}: available ({available} {unit}, needs {needed})")
    return "\n".join(lines)


def inventory_node(state: dict) -> dict:
    if "inventory" not in state.get("active_agents", []) and state.get("intent") != "combined":
        return {"inventory_result": ""}

    query = (state.get("user_query") or "").strip()

    feasibility_target = _parse_project_feasibility_target(query)
    if feasibility_target:
        feasibility_data = db_check_project_feasibility(feasibility_target)
        return {"inventory_result": _format_project_inventory_scope(feasibility_data)}

    update_match = re.search(r"(?:set|update|change)\s+(.+?)\s+(?:to|=)\s+(\d+)\b", query, flags=re.IGNORECASE)
    if update_match:
        item_name = update_match.group(1).strip()
        new_qty = int(update_match.group(2))
        result = db_update_inventory(item_name, new_qty)
        return {"inventory_result": result}

    add_command = _parse_add_inventory_command(query)
    if add_command:
        item_name, qty, unit = add_command
        result = db_add_inventory_item(item_name=item_name, quantity=qty, unit=unit)
        return {"inventory_result": result}

    if _is_delete_all_inventory(query):
        result = db_delete_all_inventory()
        return {"inventory_result": result}

    item_hint = None
    item_match = re.search(r"(?:inventory|stock|quantity)\s+(?:of|for)\s+(.+)$", query, flags=re.IGNORECASE)
    if item_match:
        item_hint = item_match.group(1).strip()

    raw_inventory = db_query_inventory(item_hint)
    try:
        parsed_inventory = json.loads(raw_inventory)
    except json.JSONDecodeError:
        return {"inventory_result": raw_inventory}

    required_materials = _extract_required_materials(query)
    # Always check required materials against full inventory to avoid
    # false "not found" results when item_hint over-filters the query.
    full_inventory = parsed_inventory
    if required_materials and item_hint:
        try:
            full_inventory = json.loads(db_query_inventory())
        except json.JSONDecodeError:
            full_inventory = parsed_inventory

    availability_lines = []
    if required_materials:
        for material, needed in required_materials:
            match = _find_inventory_match(material, full_inventory)
            if not match:
                availability_lines.append(f"- {material}: not found in inventory")
                continue
            available = int(match.get("quantity", 0))
            unit = match.get("unit", "")
            if available >= needed:
                availability_lines.append(f"- {material}: available ({available} {unit}, needs {needed})")
            else:
                shortage = needed - available
                availability_lines.append(
                    f"- {material}: insufficient ({available} {unit}, needs {needed}, short by {shortage})"
                )

    alerts = _build_stock_alerts(parsed_inventory)
    sections = [f"Inventory snapshot:\n{raw_inventory}"]
    if availability_lines:
        sections.append("Material availability for requested experiment:\n" + "\n".join(availability_lines))
    if alerts:
        sections.append(alerts)
    return {"inventory_result": "\n\n".join(sections)}
