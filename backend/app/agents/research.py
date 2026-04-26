from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.planner import is_smalltalk_query
from app.models.schema import ResearchCache, SessionLocal
from app.services.ai_service import get_llm
from app.tools.web_search import run_web_search


def _get_cached_research(topic: str):
    db = SessionLocal()
    try:
        return (
            db.query(ResearchCache)
            .filter(ResearchCache.topic == topic)
            .order_by(ResearchCache.created_at.desc())
            .first()
        )
    finally:
        db.close()


def _save_research_cache(topic: str, summary: str, source: str = "web_search") -> None:
    if not summary.strip():
        return
    db = SessionLocal()
    try:
        db.add(ResearchCache(topic=topic, summary=summary[:4000], source=source))
        db.commit()
    finally:
        db.close()


async def research_node(state: dict) -> dict:
    if "research" not in state.get("active_agents", []) and state.get("intent") != "combined":
        return {"research_result": ""}

    query = (state.get("user_query") or "").strip()
    if is_smalltalk_query(query):
        return {
            "research_result": (
                "Friendly mode: no web search needed for this message. "
                "Ask a research question and I will gather evidence, summarize findings, "
                "and suggest experiment ideas."
            )
        }

    topic = query.lower()
    cached = _get_cached_research(topic)
    if cached and getattr(cached, "summary", None):
        return {"research_result": f"From research memory:\n{cached.summary}"}

    raw_search = await run_web_search(query)

    summary_prompt = (
        "You are Sandy's Treedome Research Agent. "
        "Turn the web search notes into concise, useful lab guidance. "
        "Output in plain text with these sections:\n"
        "1) Key Findings\n"
        "2) Experiment Ideas\n"
        "3) Hypotheses to Test\n"
        "4) Recommendations / Alternatives\n"
        "Use short bullets. If evidence is weak, say so clearly."
    )
    llm = get_llm()
    summary = llm.invoke(
        [
            SystemMessage(content=summary_prompt),
            HumanMessage(content=f"Query: {query}\n\nSearch notes:\n{raw_search}"),
        ]
    ).content

    _save_research_cache(topic=topic, summary=summary, source="tavily")
    return {"research_result": summary}
