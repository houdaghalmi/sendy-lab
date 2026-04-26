import json
import re

from app.tools.db_tool import db_query_inventory, db_update_inventory


def _extract_required_materials(query: str) -> list[tuple[str, int]]:
    pattern = r"(\d+)\s*(?:x|units?|ml|l|g|kg)?\s+of\s+([a-zA-Z][a-zA-Z0-9\s\-]{1,60})"
    return [(name.strip(), int(qty)) for qty, name in re.findall(pattern, query, flags=re.IGNORECASE)]


def _build_stock_alerts(items: list[dict]) -> str:
    low_items = [item for item in items if item.get("stock_state") == "low"]
    if not low_items:
        return ""
    alerts = [
        f"- {item['name']}: {item['quantity']} {item.get('unit', '')} (min {item['min_required']})"
        for item in low_items
    ]
    return "Low stock detected:\n" + "\n".join(alerts) + "\nSuggested action: restock low items soon."


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
    availability_lines = []
    if required_materials:
        for material, needed in required_materials:
            match = next((i for i in parsed_inventory if material.lower() in i.get("name", "").lower()), None)
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
