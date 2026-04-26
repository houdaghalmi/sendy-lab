from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.schema import get_db
from app.services.agent_chat_service import (
    create_agent_task,
    delete_agent_task,
    get_agent_task,
    list_agent_tasks,
    run_agent_chat,
    save_chat_result,
    update_agent_task,
)


router = APIRouter()


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    role: str = Field(default="sandy", min_length=1, max_length=30)


class AgentChatResponse(BaseModel):
    id: int
    task: str
    status: str
    result: str
    created_at: datetime


class AgentTaskSummary(BaseModel):
    id: int
    task: str
    status: str
    created_at: datetime


class AgentOnlyResponse(BaseModel):
    result: str


class AgentTaskCreateRequest(BaseModel):
    task: str = Field(min_length=1, max_length=4000)
    result: str = Field(min_length=1)
    status: str = Field(default="completed", pattern="^(pending|running|completed|failed)$")


class AgentTaskUpdateRequest(BaseModel):
    task: Optional[str] = Field(default=None, max_length=4000)
    result: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(pending|running|completed|failed)$")


@router.post("/respond", response_model=AgentOnlyResponse)
async def respond_without_saving(payload: AgentChatRequest):
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    try:
        final_response = await run_agent_chat(user_message, payload.role.strip().lower())
        if not final_response:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Agent did not return a final response",
            )
        return AgentOnlyResponse(result=final_response)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request",
        ) from exc


@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_agent(payload: AgentChatRequest, db: Session = Depends(get_db)):
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    try:
        final_response = await run_agent_chat(user_message, payload.role.strip().lower())
        if not final_response:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Agent did not return a final response",
            )

        task = save_chat_result(db, user_message, final_response)
        return AgentChatResponse(
            id=task.id,
            task=task.task,
            status=task.status,
            result=task.result or "",
            created_at=task.created_at,
        )
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error") from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request",
        ) from exc


@router.get("/tasks", response_model=list[AgentTaskSummary])
def get_tasks(db: Session = Depends(get_db)):
    tasks = list_agent_tasks(db)
    return [
        AgentTaskSummary(
            id=task.id,
            task=task.task,
            status=task.status,
            created_at=task.created_at,
        )
        for task in tasks
    ]


@router.post("/tasks", response_model=AgentChatResponse)
def create_task(payload: AgentTaskCreateRequest, db: Session = Depends(get_db)):
    task_text = payload.task.strip()
    result_text = payload.result.strip()
    if not task_text or not result_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task and result cannot be empty")

    try:
        task = create_agent_task(db, task_text=task_text, result_text=result_text, status=payload.status)
        return AgentChatResponse(
            id=task.id,
            task=task.task,
            status=task.status,
            result=task.result or "",
            created_at=task.created_at,
        )
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error") from exc


@router.patch("/tasks/{task_id}", response_model=AgentChatResponse)
def update_task(task_id: int, payload: AgentTaskUpdateRequest, db: Session = Depends(get_db)):
    if payload.task is None and payload.result is None and payload.status is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No updates provided")

    try:
        task = update_agent_task(
            db,
            task_id=task_id,
            task_text=payload.task.strip() if payload.task is not None else None,
            result_text=payload.result.strip() if payload.result is not None else None,
            status=payload.status,
        )
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discussion not found")

        return AgentChatResponse(
            id=task.id,
            task=task.task,
            status=task.status,
            result=task.result or "",
            created_at=task.created_at,
        )
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error") from exc


@router.get("/tasks/{task_id}", response_model=AgentChatResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = get_agent_task(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discussion not found")

    return AgentChatResponse(
        id=task.id,
        task=task.task,
        status=task.status,
        result=task.result or "",
        created_at=task.created_at,
    )


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    deleted = delete_agent_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discussion not found")
    return {"deleted": task_id}
