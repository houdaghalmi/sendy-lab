# Sandy Lab

A full-stack AI lab management app inspired by Sandy's Treedome universe.

The project combines:
- A FastAPI backend with a multi-agent workflow (planner, research, inventory, database, synthesizer)
- A Next.js frontend dashboard and chat UI
- PostgreSQL data base


## Main Features

- Multi-agent chat orchestration
  - Planner routes user intent to specialist agents
  - Research agent fetches and summarizes web results
  - Inventory agent checks stock and material availability
  - Database agent manages projects, statuses, and requirements
  - Synthesizer agent builds concise final user responses by role
- Feasibility checker
  - Evaluates if a project can start based on required materials and stock levels
  - Returns statuses: FEASIBLE, RISKY, NOT_FEASIBLE
- Chat history/task persistence in database

## Tech Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- LangGraph + LangChain
- OpenRouter
- Tavily web search

### Frontend
- Next.js 

### Data Layer
- PostgreSQL (docker-compose)
- SQLite fallback (auto-enabled if PostgreSQL is unavailable)

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Optional but recommended: Docker Desktop

## Environment Variables

### Backend (backend/.env)

Required keys:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=open router model
TAVILY_API_KEY=your_tavily_key
DATABASE_URL=postgresql://sandy:sandy123@localhost:5433/sandy_lab
SECRET_KEY=change_me
```



### Frontend (frontend/src/.env or shell env)

Optional keys used by frontend service calls:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/chat
```

## Quick Start

## 1) Start database (recommended)

From backend folder:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on localhost:5433
- pgAdmin on localhost:5050

## 2) Start backend

From backend folder:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app/main.py
```

Backend runs on:
- API: http://localhost:8000


## 3) Start frontend

From frontend folder:

```bash
npm install
npm run dev
```

Frontend runs on:
- http://localhost:3000

## API Overview

Base URL: http://localhost:8000


## Data Seeding

On startup, backend seeds demo data if database is empty:
- Sample projects
- Sample inventory items
- Sample project material requirements

