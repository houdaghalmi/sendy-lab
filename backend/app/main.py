from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json

from graph import app_graph, AgentState
from models.schema import create_tables, get_db, Project, InventoryItem
from routers import chat, projects, inventory

app = FastAPI(title="Sandy's Treedome Lab API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])

@app.on_event("startup")
async def startup():
    create_tables()
    seed_data()

def seed_data():
    db = next(get_db())
    if db.query(Project).count() == 0:
        db.add_all([
            Project(name="Karate Biomechanics Study", description="Analysing force vectors in underwater karate", status="experiment", progress=67, owner="Sandy"),
            Project(name="Treedome Atmospheric AI", description="ML oxygen recycling optimisation", status="experiment", progress=81, owner="Sandy"),
            Project(name="Jellyfish Energy Cells", description="Bio-electric current harvesting", status="complete", progress=100, owner="Sandy"),
        ])
        db.add_all([
            InventoryItem(name="Acorn Extract", category="Reagents", quantity=142, unit="mL", min_threshold=50, status="ok"),
            InventoryItem(name="Motion Sensors", category="Equipment", quantity=3, unit="units", min_threshold=5, status="low"),
            InventoryItem(name="Liquid Nitrogen", category="Chemicals", quantity=0.5, unit="L", min_threshold=2, status="critical"),
            InventoryItem(name="Saline Solution", category="Chemicals", quantity=8.4, unit="L", min_threshold=2, status="ok"),
        ])
        db.commit()

# ── WebSocket endpoint for streaming agent responses ─────────────
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            initial_state: AgentState = {
                "messages": [],
                "user_query": payload.get("message", ""),
                "intent": "",
                "active_agents": [],
                "research_result": "",
                "inventory_result": "",
                "db_result": "",
                "final_response": "",
                "role": payload.get("role", "sandy")
            }
            
            # Stream each agent step
            async for event in app_graph.astream(initial_state):
                for node_name, node_output in event.items():
                    await websocket.send_json({
                        "type": "agent_update",
                        "agent": node_name,
                        "data": {k: v for k, v in node_output.items() if v}
                    })
            
            await websocket.send_json({"type": "done"})
    
    except WebSocketDisconnect:
        pass

@app.get("/health")
def health():
    return {"status": "ok", "lab": "Sandy's Treedome"}