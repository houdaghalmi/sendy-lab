"""
Feasibility Checker Service for Project Viability Analysis

This service determines if a research project can start based on:
- Available inventory quantities
- Required materials for the project
- Minimum stock levels to maintain
"""

import logging
from typing import Any, Dict

from app.tools.db_tool import db_check_project_feasibility

logger = logging.getLogger(__name__)


def check_project_feasibility(project_name_or_id: object) -> Dict[str, Any]:
    """
    Check if a project is feasible and return detailed analysis.
    
    Args:
        project_name_or_id: The project ID or project name to check
        
    Returns:
        Dictionary with feasibility status, required items, missing items, risky items, and suggestions
    """
    try:
        result = db_check_project_feasibility(project_name_or_id)
        
        status = result.get("feasibility_status")
        if status == "NOT_FOUND":
            logger.warning("Feasibility check: project not found for %s", project_name_or_id)
        elif status == "NO_REQUIREMENTS":
            logger.info("Feasibility check: no requirements defined for %s", result.get("project_name"))
        
        logger.info(
            f"Feasibility check for project '{result.get('project_name')}': "
            f"Status={result.get('feasibility_status')}, "
            f"Required={len(result.get('required_items', []))}, "
            f"Missing={len(result.get('missing_items', []))}, "
            f"Risky={len(result.get('risky_items', []))}"
        )
        
        return result
    except Exception as e:
        logger.error(f"Exception during feasibility check for project {project_name_or_id}: {str(e)}")
        return {
            "project_id": None,
            "feasibility_status": "ERROR",
            "error": f"Internal error: {str(e)}",
            "suggested_action": "Please contact support."
        }


def format_feasibility_for_agent(feasibility_data: Dict[str, Any]) -> str:
    """
    Format feasibility check result into a human-readable string for agent responses.
    
    Args:
        feasibility_data: The feasibility check result
        
    Returns:
        Formatted string for agent response
    """
    project_name = feasibility_data.get("project_name", "Unknown Project")
    status = feasibility_data.get("feasibility_status", "UNKNOWN")
    
    # Status emoji and color mapping
    status_emoji = {
        "FEASIBLE": "✅",
        "RISKY": "⚠️",
        "NOT_FEASIBLE": "❌",
        "NOT_FOUND": "❌",
        "NO_REQUIREMENTS": "⚠️",
        "ERROR": "⚠️"
    }.get(status, "❓")
    
    lines = [f"{status_emoji} {status}\n"]
    lines.append(f"Project: {project_name}\n")
    
    # Handle errors
    if status in {"ERROR", "NOT_FOUND"}:
        error_msg = feasibility_data.get("message") or feasibility_data.get("error", "Unknown error")
        lines.append(f"{error_msg}\n")
        return "".join(lines)

    if status == "NO_REQUIREMENTS":
        lines.append("Project found, but no requirements are defined yet.\n")
        return "".join(lines)
    
    # Required materials
    required_items = feasibility_data.get("required_items", [])
    if required_items:
        lines.append(f"\nRequired Materials ({len(required_items)}):\n")
        for item in required_items:
            lines.append(
                f"  • {item['item_name']}: {item['available_quantity']} {item['unit']} "
                f"(need {item['required_quantity']} {item['unit']})\n"
            )
    
    # Missing materials
    missing_items = feasibility_data.get("missing_items", [])
    if missing_items:
        lines.append(f"\n❌ Missing Materials:\n")
        for item in missing_items:
            lines.append(
                f"  • {item['item_name']}: missing {item['missing_quantity']} {item['unit']}\n"
            )
    
    # Risky materials
    risky_items = feasibility_data.get("risky_items", [])
    if risky_items:
        lines.append(f"\n⚠️ Low Stock After Use:\n")
        for item in risky_items:
            lines.append(
                f"  • {item['item_name']}: would drop to {item['remaining_after_use']} {item['unit']} "
                f"(min: {item['min_required_in_stock']} {item['unit']})\n"
            )
    
    # Suggested action
    suggested_action = feasibility_data.get("suggested_action", "")
    if suggested_action:
        lines.append(f"\n📌 Suggested Action:\n{suggested_action}\n")
    
    return "".join(lines)


def get_feasibility_summary(feasibility_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get a summary of feasibility for dashboard/UI display.
    
    Args:
        feasibility_data: The feasibility check result
        
    Returns:
        Summary dictionary for UI consumption
    """
    return {
        "project_id": feasibility_data.get("project_id"),
        "project_name": feasibility_data.get("project_name"),
        "project_status": feasibility_data.get("project_status"),
        "project_priority": feasibility_data.get("project_priority"),
        "feasibility_status": feasibility_data.get("feasibility_status"),
        "stats": {
            "total_required_items": len(feasibility_data.get("required_items", [])),
            "missing_items_count": len(feasibility_data.get("missing_items", [])),
            "risky_items_count": len(feasibility_data.get("risky_items", [])),
        },
        "suggested_action": feasibility_data.get("suggested_action", ""),
        "can_proceed": feasibility_data.get("feasibility_status") in ["FEASIBLE", "RISKY"]
    }
