import json
import re

from app.tools.db_tool import db_add_inventory_item, db_query_inventory, db_update_inventory


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

    unit_pattern = r"(ml|l|g|kg|units?)"
    patterns = [
        rf"(?:add|create|insert)\s+(?P<name>[a-zA-Z][a-zA-Z0-9\s\-]{{1,60}}?)\s+to\s+(?:the\s+)?inventory\s+(?P<qty>\d+)\s*(?P<unit>{unit_pattern})\b",
        rf"(?:add|create|insert)\s+(?P<name>[a-zA-Z][a-zA-Z0-9\s\-]{{1,60}}?)\s+(?:with\s+)?(?P<qty>\d+)\s*(?P<unit>{unit_pattern})\s+(?:to|on|into)\s+(?:the\s+)?inventory\b",
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


def inventory_node(state: dict) -> dict:
    if "inventory" not in state.get("active_agents", []) and state.get("intent") != "combined":
        return {"inventory_result": ""}

    query = (state.get("user_query") or "").strip()

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
