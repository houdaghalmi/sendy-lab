import operator
from typing import Annotated, List, TypedDict


class AgentState(TypedDict):
    messages: Annotated[List, operator.add]
    user_query: str
    intent: str
    active_agents: List[str]
    research_result: str
    inventory_result: str
    db_result: str
    final_response: str
    role: str
