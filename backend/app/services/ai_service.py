from langchain_openai import ChatOpenAI

from app.config import settings


_llm_instance = None


def get_llm() -> ChatOpenAI:
	global _llm_instance
	if _llm_instance is None:
		_llm_instance = ChatOpenAI(
			api_key=settings.OPENROUTER_API_KEY,
			base_url=settings.OPENROUTER_BASE_URL,
			model=settings.OPENROUTER_MODEL,
			temperature=0.2,
		)
	return _llm_instance
