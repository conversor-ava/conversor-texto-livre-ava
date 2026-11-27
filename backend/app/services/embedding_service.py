import math

import httpx

from app.core.config import settings

MAX_EMBED_BATCH_SIZE = 16


class EmbeddingError(Exception):
    pass


class EmbeddingTimeoutError(EmbeddingError):
    pass


class OllamaEmbeddingService:
    def __init__(
        self,
        model: str | None = None,
        base_url: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self.model = model or settings.ollama_embed_model
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.timeout = (
            timeout
            if timeout is not None
            else settings.ollama_timeout_seconds
        )

    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout, connect=10.0)
            ) as client:
                response = await client.post(
                    f"{self.base_url}/api/embed",
                    json={
                        "model": self.model,
                        "input": texts,
                        "truncate": False,
                    },
                )

                response.raise_for_status()
                vectors = response.json()["embeddings"]

        except httpx.TimeoutException as exc:
            raise EmbeddingTimeoutError(
                "Tempo limite excedido ao gerar os embeddings."
            ) from exc
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            raise EmbeddingError(
                "Não foi possível gerar os embeddings."
            ) from exc

        if len(vectors) != len(texts):
            raise EmbeddingError(
                "A quantidade de embeddings recebidos é inválida."
            )

        if (
            not vectors
            or not all(
                isinstance(vector, list)
                and len(vector) > 0
                and all(
                    isinstance(value, (int, float))
                    and math.isfinite(value)
                    for value in vector
                )
                and any(value != 0 for value in vector)
                for vector in vectors
            )
        ):
            raise EmbeddingError("O provider retornou vetores inválidos.")

        return vectors

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts or any(not text.strip() for text in texts):
            raise ValueError("Os textos não podem estar vazios.")

        vectors: list[list[float]] = []
        for inicio in range(0, len(texts), MAX_EMBED_BATCH_SIZE):
            lote = texts[inicio : inicio + MAX_EMBED_BATCH_SIZE]
            vectors.extend(await self._embed_batch(lote))

        if len({len(vector) for vector in vectors}) != 1:
            raise EmbeddingError("Os embeddings possuem dimensões diferentes.")

        return vectors