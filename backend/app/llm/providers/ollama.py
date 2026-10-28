from __future__ import annotations

import httpx

from app.llm.base import LLMGenerationError, LLMProvider

DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"
DEFAULT_TIMEOUT_SECONDS = 120.0


class OllamaProvider(LLMProvider):
    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        base_url: str = DEFAULT_OLLAMA_URL,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    async def generate(self, prompt: str) -> str:
        url = f"{self._base_url}/api/generate"
        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
        except httpx.HTTPError as erro:
            raise LLMGenerationError(f"Falha ao chamar o Ollama em {url}: {erro}") from erro

        corpo = response.json()
        resposta = corpo.get("response")
        if not resposta:
            raise LLMGenerationError(
                "O Ollama retornou uma resposta vazia ou em formato inesperado"
            )

        return resposta