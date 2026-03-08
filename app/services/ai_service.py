import os
from typing import Optional
import os
import logging
from typing import Optional, List, Dict

try:
	import google.generativeai as genai  # optional; used when available/configured
	_HAS_GENAI = True
except Exception:
	genai = None
	_HAS_GENAI = False

logger = logging.getLogger(__name__)


class AIService:
	"""AI helper with minimal conversation history and fallback behavior.

	Features:
	- Uses `google.generativeai` when available and configured.
	- Keeps a small conversation history when `chat()` is used.
	- Falls back to deterministic stub responses when no upstream client
	  is configured, allowing offline development and tests.
	"""

	def __init__(self, api_key: Optional[str] = None, model: str = "chat-bison@001"):
		self.api_key = api_key or os.getenv("AI_API_KEY")
		self.model = model
		self.history: List[Dict[str, str]] = []
		if _HAS_GENAI and self.api_key:
			try:
				genai.configure(api_key=self.api_key)
			except Exception:
				logger.exception("Failed configuring generative client")

	def clear_history(self) -> None:
		self.history.clear()

	def chat(self, user_message: str, max_tokens: int = 512) -> str:
		"""Append the message to history, call the model, and return the reply.

		This method is synchronous and resilient: on any upstream error it
		returns a deterministic fallback message so callers don't raise.
		"""
		self.history.append({"role": "user", "content": user_message})

		if _HAS_GENAI and self.api_key:
			try:
				resp = genai.generate_text(model=self.model, input=user_message)
				# handle a few common return shapes
				if hasattr(resp, "output"):
					reply = resp.output
				elif isinstance(resp, dict) and "candidates" in resp:
					reply = resp["candidates"][0].get("content", "")
				else:
					reply = str(resp)
				self.history.append({"role": "assistant", "content": reply})
				return reply
			except Exception:
				logger.exception("AI generation failed; falling back to stub")

		# deterministic fallback
		fallback = f"[ai-stub] {user_message[:200]}"
		self.history.append({"role": "assistant", "content": fallback})
		return fallback


__all__ = ["AIService"]

