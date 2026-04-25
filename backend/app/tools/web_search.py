from langchain_community.tools.tavily_search import TavilySearchResults
from config import settings
import os

os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY

web_search_tool = TavilySearchResults(
    max_results=4,
    name="web_search",
    description="Search the web for scientific research, papers, and current information. Use for: finding latest research, experiment ideas, scientific facts."
)

async def run_web_search(query: str) -> str:
    results = web_search_tool.invoke({"query": query})
    if isinstance(results, list):
        return "\n\n".join([f"**{r.get('title','')}**\n{r.get('content','')}" for r in results[:3]])
    return str(results)