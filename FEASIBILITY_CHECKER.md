# Feasibility Checker Implementation Guide

## Overview
The Feasibility Checker feature determines whether a research project can start based on current inventory stock levels.

## Architecture

### Backend Components

#### 1. **Database Layer** (`app/tools/db_tool.py`)
New functions added to handle project requirements:

- **`db_get_project_feasibility(project_id)`** - Main feasibility check
  - Retrieves project and its requirements
  - Joins with inventory data
  - Compares quantities and determines status
  - Returns: FEASIBLE | RISKY | NOT_FEASIBLE

- **`db_add_project_requirement(project_id, inventory_id, required_quantity)`** - Add/update requirements

- **`db_get_project_requirements(project_id)`** - List all requirements for a project

#### 2. **Service Layer** (`app/services/feasibility_service.py`)
Orchestrates feasibility logic:

- **`check_project_feasibility(project_id)`** - Calls database layer with error handling
- **`format_feasibility_for_agent(feasibility_data)`** - Formats results for agent responses (markdown-like text)
- **`get_feasibility_summary(feasibility_data)`** - Summarizes for UI consumption

#### 3. **API Layer** (`app/routers/projects.py`)
New endpoint:

```
GET /api/projects/{proj_id}/feasibility
```

Returns comprehensive feasibility analysis:
```json
{
  "project_id": 1,
  "project_name": "Tree Growth Monitoring",
  "project_status": "planned",
  "project_priority": 2,
  "feasibility_status": "RISKY",
  "required_items": [...],
  "missing_items": [...],
  "risky_items": [...],
  "suggested_action": "..."
}
```

#### 4. **Agent Integration** (`app/agents/inventory.py`)
Enhanced inventory agent to:

- Detect feasibility check requests using keyword matching
- Extract project ID or name from queries
- Call feasibility service
- Format response for agent output

**Example queries recognized:**
- "Check feasibility for project 1"
- "Is project 2 feasible?"
- "Can we start Tree Growth Monitoring?"

### Frontend Components

#### 1. **FeasibilityChecker Component** (`src/components/FeasibilityChecker.jsx`)
Displays detailed feasibility analysis:

- Status badge (✅ FEASIBLE / ⚠️ RISKY / ❌ NOT_FEASIBLE)
- Project information
- Required materials list
- Missing items (if any)
- Risky items (would drop below min stock)
- Suggested actions
- Refresh button

#### 2. **ProjectList Update** (`src/components/ProjectList.jsx`)
Added:

- "Check Feasibility" button on each project
- Modal overlay for displaying FeasibilityChecker
- Clean integration with existing project UI

#### 3. **API Service** (`src/services/agentApi.js`)
New functions:

- `checkProjectFeasibility(projectId)` - Fetch feasibility data
- `listProjects()` - Get all projects
- `getProject(projectId)` - Get single project

## Database Schema

### ProjectRequirement Table
```sql
CREATE TABLE project_requirements (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL FOREIGN KEY,
  inventory_id INTEGER NOT NULL FOREIGN KEY,
  required_quantity INTEGER NOT NULL
);
```

### Relationship
```
Projects (1) ──── (Many) ProjectRequirements ──── (1) InventoryItems
```

## Feasibility Rules

### FEASIBLE
- ✅ All required items have `quantity >= required_quantity`
- All items will remain above `min_required` after use

### RISKY
- ⚠️ All items have enough quantity for the project
- BUT: At least one item will drop below `min_required` after use

### NOT_FEASIBLE
- ❌ At least one item has insufficient quantity
- Cannot proceed without restocking

## Sample Data

Seeded projects with requirements:

### Project 1: "Karate Biomechanics Study"
- Requires: 5 Motion Sensors (available: 3) → **NOT_FEASIBLE**
- Requires: 2 L Liquid Nitrogen (available: 1) → **NOT_FEASIBLE**

### Project 2: "Treedome Atmospheric AI"
- Requires: 100 mL Acorn Extract (available: 142, min: 50)
  - After use: 42 mL (above min: 50) → **RISKY**
- Requires: 5 L Saline Solution (available: 8, min: 2)
  - After use: 3 L (above min: 2) → **FEASIBLE**

## Usage Examples

### Via API
```bash
curl http://localhost:8000/api/projects/1/feasibility
```

### Via Agent Chat
```
User: "Check feasibility for project 1"
Agent: "✅ FEASIBLE / ⚠️ RISKY / ❌ NOT_FEASIBLE

Project: Karate Biomechanics Study

Required Materials (2):
  • Motion Sensors: 3 units (need 5 units)
  • Liquid Nitrogen: 1 L (need 2 L)

❌ Missing Materials:
  • Motion Sensors: missing 2 units
  • Liquid Nitrogen: missing 1 L

📌 Suggested Action:
Restock missing materials before starting the project. 2 item(s) need restocking."
```

### Via Frontend
1. Navigate to Projects section
2. Click "Check Feasibility" button on any project
3. Modal displays detailed analysis
4. Review suggestions and take action

## Error Handling

- Non-existent project → 404 with error message
- Database errors → 500 with error details
- Missing requirements → Shows "No specific material requirements"

## Future Enhancements

1. **Bulk Operations**
   - Check multiple projects at once
   - Export feasibility reports

2. **Predictive Analysis**
   - Estimate when stock will drop below min
   - Suggest procurement timeline

3. **Historical Tracking**
   - Log feasibility checks over time
   - Track project completion success rates

4. **Advanced Filtering**
   - Filter by priority level
   - Filter by status

5. **Auto-Notifications**
   - Alert when critical projects become non-feasible
   - Suggest restocking timing

## Testing Checklist

- [x] Database schema with project requirements
- [x] Feasibility calculation logic (FEASIBLE/RISKY/NOT_FEASIBLE)
- [x] API endpoint returns correct data format
- [x] Agent detects feasibility queries
- [x] Frontend displays results correctly
- [x] Error cases handled gracefully
- [x] Sample data seeded correctly

## Files Modified/Created

**Backend:**
- ✏️ `app/tools/db_tool.py` - Added 3 new functions
- ✏️ `app/agents/inventory.py` - Enhanced with feasibility detection
- ✏️ `app/routers/projects.py` - Added feasibility endpoint
- ✏️ `app/main.py` - Updated seed_data with requirements
- ✨ `app/services/feasibility_service.py` - New service layer

**Frontend:**
- ✨ `src/components/FeasibilityChecker.jsx` - New component
- ✨ `src/components/FeasibilityChecker.module.css` - Styling
- ✏️ `src/components/ProjectList.jsx` - Added button and modal
- ✏️ `src/services/agentApi.js` - Added 3 new API functions

## Notes

- Uses existing database connections and session management
- Integrates seamlessly with existing agent architecture
- Maintains backward compatibility with current project system
- All database operations properly handle SQLite fallback
- Error messages provide clear guidance to users
