from copy import deepcopy
from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.agents.database import database_node
from app.agents.inventory import inventory_node
from app.agents.planner import planner_node
from app.agents.research import research_node
from app.agents.state import AgentState
from app.agents.synthesizer import synthesizer_node


def _route_from_planner(state: AgentState) -> Literal["research", "inventory", "database", "synthesizer"]:
    agents = state.get("active_agents", [])
    if "research" in agents:
        return "research"
    if "inventory" in agents:
        return "inventory"
    if "database" in agents:
        return "database"
    return "synthesizer"


def _route_after_research(state: AgentState) -> Literal["inventory", "database", "synthesizer"]:
    agents = state.get("active_agents", [])
    if "inventory" in agents:
        return "inventory"
    if "database" in agents:
        return "database"
    return "synthesizer"


def _route_after_inventory(state: AgentState) -> Literal["database", "synthesizer"]:
    if "database" in state.get("active_agents", []):
        return "database"
    return "synthesizer"


graph_builder = StateGraph(AgentState)
graph_builder.add_node("planner", planner_node)
graph_builder.add_node("research", research_node)
graph_builder.add_node("inventory", inventory_node)
graph_builder.add_node("database", database_node)
graph_builder.add_node("synthesizer", synthesizer_node)

graph_builder.add_edge(START, "planner")
graph_builder.add_conditional_edges("planner", _route_from_planner)
graph_builder.add_conditional_edges("research", _route_after_research)
graph_builder.add_conditional_edges("inventory", _route_after_inventory)
graph_builder.add_edge("database", "synthesizer")
graph_builder.add_edge("synthesizer", END)

app_graph = graph_builder.compile()


async def run_agent_workflow(initial_state: AgentState):
    state = deepcopy(initial_state)

    planner_update = planner_node(state)
    state.update(planner_update)
    yield {"planner": planner_update}

    if "research" in state.get("active_agents", []):
        research_update = await research_node(state)
        state.update(research_update)
        yield {"research": research_update}

    if "inventory" in state.get("active_agents", []):
        inventory_update = inventory_node(state)
        state.update(inventory_update)
        yield {"inventory": inventory_update}

    if "database" in state.get("active_agents", []):
        database_update = database_node(state)
        state.update(database_update)
        yield {"database": database_update}

    final_update = synthesizer_node(state)
    state.update(final_update)
    yield {"synthesizer": final_update}