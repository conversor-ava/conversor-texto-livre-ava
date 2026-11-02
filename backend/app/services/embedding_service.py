import math

import httpx


class EmbeddingError(Exception):
    pass


class OllamaEmbeddingService:
    def __init__(
        self,
        model: str = "nomic-embed-text",
        base_url: str = "http://localhost:11434",
        timeout: float = 120.0,
    ) -> None:
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts or any(not text.strip() for text in texts):
            raise ValueError("Os textos não podem estar vazios.")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
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
                for vector in vectors
            )
        ):
            raise EmbeddingError("O provider retornou vetores inválidos.")

        if len({len(vector) for vector in vectors}) != 1:
            raise EmbeddingError("Os embeddings possuem dimensões diferentes.")

        return vectors