from __future__ import annotations

import os

import httpx

from app.llm.base import LLMGenerationError, LLMProvider, LLMTimeoutError

DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"
DEFAULT_TIMEOUT_SECONDS = 180.0
DEFAULT_NUM_CTX = 8192
DEFAULT_NUM_PREDICT = 4096


class OllamaProvider(LLMProvider):
    def __init__(
        self,
        model: str | None = None,
        base_url: str | None = None,
        timeout: float | None = None,
        num_ctx: int | None = None,
        num_predict: int | None = None,
    ) -> None:
        self._model = model or os.getenv("OLLAMA_MODEL", DEFAULT_MODEL)
        self._base_url = (
            base_url or os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_URL)
        ).rstrip("/")
        self._timeout = (
            timeout
            if timeout is not None
            else float(os.getenv("OLLAMA_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS))
        )
        self._num_ctx = (
            num_ctx
            if num_ctx is not None
            else int(os.getenv("OLLAMA_NUM_CTX", DEFAULT_NUM_CTX))
        )
        self._num_predict = (
            num_predict
            if num_predict is not None
            else int(os.getenv("OLLAMA_NUM_PREDICT", DEFAULT_NUM_PREDICT))
        )

    async def generate(self, prompt: str) -> str:
        url = f"{self._base_url}/api/generate"
        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.3,
                "num_ctx": self._num_ctx,
                "num_predict": self._num_predict,
            },
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