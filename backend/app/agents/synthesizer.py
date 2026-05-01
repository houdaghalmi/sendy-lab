from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.planner import is_smalltalk_query
from app.services.ai_service import get_llm


def synthesizer_node(state: dict) -> dict:
    role = state.get("role", "sandy")
    intent = state.get("intent", "combined")
    inventory_result = state.get("inventory_result", "")
    db_result = state.get("db_result", "")

    if intent == "chat" and is_smalltalk_query(state.get("user_query", "")):
        persona = {
            "sandy": "Howdy! Sandy here.",
            "squidward": "Hello. Squidward here.",
            "spongebob": "Hi! SpongeBob here!",
        }.get(role, "Hi there!")
        return {
            "final_response": (
                f"{persona} I can help with lab research, experiment ideas, inventory checks, "
                "and project planning. What would you like to do next?"
            )
        }

    # For single-domain CRUD flows, return authoritative tool output directly
    # to avoid any LLM formatting drift or hallucinated success messages.
    if intent == "inventory" and inventory_result:
        return {"final_response": inventory_result}
    if intent == "projects" and db_result:
        return {"final_response": db_result}

    prompt = (
        f"You are speaking to the role '{role}' in Sandy's lab app. "
        "You must stay in Sandy's Treedome lab domain (research, experiments, projects, inventory). "
        "Do not invent unrelated entities, companies, contracts, military facts, or acronyms not present in outputs. "
        "Use the agent outputs and provide a concise actionable response. "
        "If intent is chat, respond naturally and briefly without dumping technical data. "
        "If data is missing, mention what is available. Keep it under 180 words."
    )
    combined = (
        f"Intent: {intent}\n"
        f"User query: {state['user_query']}\n\n"
        f"Research output:\n{state.get('research_result', '')}\n\n"
        f"Inventory output:\n{inventory_result}\n\n"
        f"Database output:\n{db_result}\n"
    )
    llm = get_llm()
    response = llm.invoke([SystemMessage(content=prompt), HumanMessage(content=combined)])
    return {"final_response": response.content}
