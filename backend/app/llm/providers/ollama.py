from __future__ import annotations

import httpx

from app.core.config import settings
from app.llm.base import LLMGenerationError, LLMProvider, LLMTimeoutError


class OllamaProvider(LLMProvider):
    def __init__(
        self,
        model: str | None = None,
        base_url: str | None = None,
        timeout: float | None = None,
        num_ctx: int | None = None,
        num_predict: int | None = None,
    ) -> None:
        self._model = model or settings.ollama_model
        self._base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self._timeout = (
            timeout if timeout is not None else settings.ollama_timeout_seconds
        )
        self._num_ctx = (
            num_ctx if num_ctx is not None else settings.ollama_num_ctx
        )
        self._num_predict = (
            num_predict
            if num_predict is not None
            else settings.ollama_num_predict
        )

    async def generate(self, prompt: str, seed: int | None = None) -> str:
        url = f"{self._base_url}/api/generate"
        options: dict[str, int | float] = {
            "temperature": 0.3,
            "num_ctx": self._num_ctx,
            "num_predict": self._num_predict,
        }
        if seed is not None:
            options["seed"] = seed

        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": options,
        }

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(self._timeout, connect=10.0)
            ) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
        except httpx.TimeoutException as erro:
            raise LLMTimeoutError(
                "Tempo limite excedido ao aguardar resposta do Ollama."
            ) from erro
        except httpx.HTTPError as erro:
            raise LLMGenerationError(f"Falha ao chamar o Ollama em {url}: {erro}") from erro

        try:
            corpo = response.json()
        except ValueError as erro:
            raise LLMGenerationError(
                "O Ollama retornou uma resposta em formato inválido"
            ) from erro

        if not isinstance(corpo, dict):
            raise LLMGenerationError(
                "O Ollama retornou uma resposta vazia ou em formato inesperado"
            )

        resposta = corpo.get("response")
        if not isinstance(resposta, str) or not resposta.strip():
            raise LLMGenerationError(
                "O Ollama retornou uma resposta vazia ou em formato inesperado"
            )

        return resposta