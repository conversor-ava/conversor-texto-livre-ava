import math
from dataclasses import dataclass

from app.services.text_chunker import TextChunk


@dataclass(frozen=True)
class SearchResult:
    chunk: TextChunk
    score: float


def cosine_similarity(
    vector_a: list[float],
    vector_b: list[float],
) -> float:
    if not vector_a or len(vector_a) != len(vector_b):
        raise ValueError("Os vetores devem possuir a mesma dimensão.")

    norm_a = math.sqrt(sum(value * value for value in vector_a))
    norm_b = math.sqrt(sum(value * value for value in vector_b))

    if norm_a == 0 or norm_b == 0:
        raise ValueError("Os vetores não podem ser nulos.")

    dot_product = sum(
        a * b for a, b in zip(vector_a, vector_b)
    )

    return dot_product / (norm_a * norm_b)


class InMemoryVectorStore:
    def __init__(self) -> None:
        self._entries: list[tuple[TextChunk, list[float]]] = []
        self._dimensions: int | None = None

    def add(
        self,
        chunks: list[TextChunk],
        embeddings: list[list[float]],
    ) -> None:
        if len(chunks) != len(embeddings):
            raise ValueError(
                "Cada chunk deve possuir um embedding."
            )

        if not chunks:
            return

        dimensions = len(embeddings[0])

        if dimensions == 0:
            raise ValueError("Os embeddings não podem estar vazios.")

        if any(
            len(vector) != dimensions
            or not all(math.isfinite(value) for value in vector)
            or not any(value != 0 for value in vector)
            for vector in embeddings
        ):
            raise ValueError("Os embeddings são inválidos.")

        if self._dimensions is not None and dimensions != self._dimensions:
            raise ValueError("Dimensões incompatíveis com o índice.")

        self._dimensions = dimensions

        self._entries.extend(
            (chunk, vector.copy())
            for chunk, vector in zip(chunks, embeddings)
        )

    def search(
        self,
        query_embedding: list[float],
        top_k: int = 3,
    ) -> list[SearchResult]:
        if top_k <= 0:
            raise ValueError("top_k deve ser maior que zero.")

        if not self._entries:
            return []

        if len(query_embedding) != self._dimensions:
            raise ValueError("Dimensão da consulta incompatível.")

        results = [
            SearchResult(
                chunk=chunk,
                score=cosine_similarity(query_embedding, embedding),
            )
            for chunk, embedding in self._entries
        ]

        return sorted(
            results,
            key=lambda result: result.score,
            reverse=True,
        )[:top_k]