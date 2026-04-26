from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.graph import AgentState, run_agent_workflow
from app.models.schema import AgentTask


DUPLICATE_WINDOW_SECONDS = 10


async def run_agent_chat(message: str, role: str = "sandy") -> str:
    initial_state: AgentState = {
        "messages": [],
        "user_query": message,
        "intent": "",
        "active_agents": [],
        "target_agent": "",
        "feasibility_target": "",
        "research_result": "",
        "inventory_result": "",
        "db_result": "",
        "final_response": "",
        "role": role,
    }

    final_response = ""
    async for event in run_agent_workflow(initial_state):
        for node_output in event.values():
            response = (node_output or {}).get("final_response")
            if response:
                final_response = response

    return final_response


def find_recent_duplicate(db: Session, task: str, result: str) -> Optional[AgentTask]:
    latest = (
        db.query(AgentTask)
        .filter(AgentTask.task == task, AgentTask.result == result, AgentTask.status == "completed")
        .order_by(desc(AgentTask.created_at))
        .first()
    )
    if not latest or not latest.created_at:
        return None

    if latest.created_at >= datetime.utcnow() - timedelta(seconds=DUPLICATE_WINDOW_SECONDS):
        return latest
    return None


def save_chat_result(db: Session, message: str, response: str) -> AgentTask:
    existing = find_recent_duplicate(db, message, response)
    if existing:
        return existing

    task = AgentTask(task=message, status="completed", result=response)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def create_agent_task(db: Session, task_text: str, result_text: str, status: str = "completed") -> AgentTask:
    task = AgentTask(task=task_text, status=status, result=result_text)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_agent_task(
    db: Session,
    task_id: int,
    task_text: Optional[str] = None,
    result_text: Optional[str] = None,
    status: Optional[str] = None,
) -> Optional[AgentTask]:
    task = get_agent_task(db, task_id)
    if not task:
        return None

    if task_text is not None:
        task.task = task_text
    if result_text is not None:
        task.result = result_text
    if status is not None:
        task.status = status

    db.commit()
    db.refresh(task)
    return task


def list_agent_tasks(db: Session) -> list[AgentTask]:
    return db.query(AgentTask).order_by(desc(AgentTask.created_at)).all()


def get_agent_task(db: Session, task_id: int) -> Optional[AgentTask]:
    return db.query(AgentTask).filter(AgentTask.id == task_id).first()


def delete_agent_task(db: Session, task_id: int) -> bool:
    task = get_agent_task(db, task_id)
    if not task:
        return False

    db.delete(task)
    db.commit()
    return True
