import sys
from pathlib import Path
import os
import socket

# Allow running this file directly (python app/main.py) by ensuring backend/ is on sys.path.
if __package__ is None or __package__ == "":
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json

from app.graph import AgentState, run_agent_workflow
from app.models.schema import create_tables, get_db, Project, InventoryItem
from app.routers import projects, inventory

@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables()
    seed_data()
    yield


app = FastAPI(title="Sandy's Treedome Lab API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])

def seed_data():
    db = next(get_db())
    try:
        if db.query(Project).count() == 0:
            db.add_all([
                Project(name="Karate Biomechanics Study", description="Analysing force vectors in underwater karate", status="ongoing", priority=2),
                Project(name="Treedome Atmospheric AI", description="ML oxygen recycling optimisation", status="ongoing", priority=1),
                Project(name="Jellyfish Energy Cells", description="Bio-electric current harvesting", status="completed", priority=1),
            ])
            db.add_all([
                InventoryItem(name="Acorn Extract", category="Reagents", quantity=142, unit="mL", min_required=50),
                InventoryItem(name="Motion Sensors", category="Equipment", quantity=3, unit="units", min_required=5),
                InventoryItem(name="Liquid Nitrogen", category="Chemicals", quantity=1, unit="L", min_required=2),
                InventoryItem(name="Saline Solution", category="Chemicals", quantity=8, unit="L", min_required=2),
            ])
            db.commit()
    finally:
        db.close()

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
            async for event in run_agent_workflow(initial_state):
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


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    base_port = int(os.getenv("PORT", "8000"))

    def find_open_port(start_port: int) -> int:
        port = start_port
        while True:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
                try:
                    probe.bind((host, port))
                    return port
                except OSError:
                    port += 1

    port = find_open_port(base_port)

    uvicorn.run(app, host=host, port=port)