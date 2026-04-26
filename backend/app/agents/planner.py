import json
import re
from typing import List, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from app.services.ai_service import get_llm


RESEARCH_KEYWORDS = {
	"research", "paper", "study", "hypothesis", "experiment", "idea", "analysis", "benefit", "compare"
}
INVENTORY_KEYWORDS = {
	"inventory", "stock", "reagent", "material", "supply", "quantity", "item", "consumable"
}
PROJECT_KEYWORDS = {
	"project", "plan", "task", "roadmap", "priority", "deadline", "schedule", "milestone", "status"
}
DATABASE_ACTION_KEYWORDS = {
	"delete", "remove", "create", "add", "update", "list", "show", "fetch", "database", "record"
}


def is_smalltalk_query(query: str) -> bool:
	text = (query or "").strip().lower()
	if not text:
		return True
	normalized = re.sub(r"[^a-z\s]", "", text)
	tokens = [t for t in normalized.split() if t]
	if len(tokens) <= 3:
		greetings = {
			"hi", "hello", "hey", "yo", "hola", "sup", "thanks", "thank", "thx", "ok", "okay"
		}
		if all(t in greetings for t in tokens):
			return True
	return normalized in {"good morning", "good afternoon", "good evening", "how are you"}


def _contains_any(text: str, words: set[str]) -> bool:
	return any(w in text for w in words)


def _rule_based_intent(query: str) -> Optional[dict]:
	text = (query or "").strip().lower()
	if is_smalltalk_query(text):
		return {"intent": "chat", "active_agents": []}

	wants_research = _contains_any(text, RESEARCH_KEYWORDS)
	wants_inventory = _contains_any(text, INVENTORY_KEYWORDS)
	wants_projects = _contains_any(text, PROJECT_KEYWORDS)
	wants_db_action = _contains_any(text, DATABASE_ACTION_KEYWORDS)

	agents: List[str] = []
	if wants_research:
		agents.append("research")
	if wants_inventory:
		agents.append("inventory")
	if wants_projects:
		agents.append("database")
	if wants_db_action and "database" not in agents:
		agents.append("database")

	if len(agents) > 1:
		return {"intent": "combined", "active_agents": agents}
	if agents == ["research"]:
		return {"intent": "research", "active_agents": agents}
	if agents == ["inventory"]:
		return {"intent": "inventory", "active_agents": agents}
	if agents == ["database"]:
		return {"intent": "projects", "active_agents": agents}
	return None


def planner_node(state: dict) -> dict:
	heuristic = _rule_based_intent(state.get("user_query", ""))
	if heuristic:
		return heuristic

	prompt = (
		"You are the planner for Sandy's Treedome multi-agent system. "
		"Classify the user query into one of these intents: "
		"research, inventory, projects, combined, chat. "
		"Use chat for greetings or casual conversation like hi/hello/hey/thanks. "
		"Return strict JSON only with keys: intent and active_agents. "
		'active_agents can only include "research", "inventory", "database".'
	)

	llm = get_llm()
	response = llm.invoke(
		[
			SystemMessage(content=prompt),
			HumanMessage(content=state.get("user_query", "")),
		]
	)

	try:
		parsed = json.loads(response.content)
		intent = parsed.get("intent", "combined")
		active_agents = parsed.get("active_agents", ["research", "inventory", "database"])
		if not isinstance(active_agents, list):
			active_agents = ["research", "inventory", "database"]
		return {"intent": intent, "active_agents": active_agents}
	except Exception:
		fallback = _rule_based_intent(state.get("user_query", "").lower())
		if fallback:
			return fallback
		return {"intent": "combined", "active_agents": ["research", "inventory", "database"]}
