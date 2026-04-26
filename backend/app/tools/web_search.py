from langchain_community.tools.tavily_search import TavilySearchResults
from app.config import settings
import os
import re

os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

web_search_tool = TavilySearchResults(
    max_results=4,
    name="web_search",
    description="Search the web for scientific research, papers, and current information. Use for: finding latest research, experiment ideas, scientific facts."
)


def _clean_text(value: str, limit: int = 420) -> str:
    text = re.sub(r"\s+", " ", (value or "")).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."

async def run_web_search(query: str) -> str:
    results = web_search_tool.invoke({"query": query})
    if isinstance(results, list):
        cleaned = []
        for r in results[:3]:
            title = _clean_text(r.get("title", ""), 120)
            content = _clean_text(r.get("content", ""), 420)
            url = r.get("url", "")
            cleaned.append(f"Title: {title}\nEvidence: {content}\nSource: {url}")
        return "\n\n".join(cleaned)
    return str(results)