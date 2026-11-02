import pytest

from app.services.text_chunker import TextChunk
from app.services.vector_store import (
    InMemoryVectorStore,
    cosine_similarity,
)


def criar_chunks() -> list[TextChunk]:
    return [
        TextChunk(0, "Python", 0, 6),
        TextChunk(1, "MySQL", 6, 11),
        TextChunk(2, "Git", 11, 14),
    ]


def test_cosine_similarity_identical_vectors() -> None:
    result = cosine_similarity([1.0, 0.0], [1.0, 0.0])

    assert result == pytest.approx(1.0)


def test_cosine_similarity_orthogonal_vectors() -> None:
    result = cosine_similarity([1.0, 0.0], [0.0, 1.0])

    assert result == pytest.approx(0.0)


def test_cosine_similarity_opposite_vectors() -> None:
    result = cosine_similarity([1.0, 0.0], [-1.0, 0.0])

    assert result == pytest.approx(-1.0)


def test_vector_store_returns_most_relevant_chunk() -> None:
    store = InMemoryVectorStore()

    store.add(
        criar_chunks(),
        [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0],
        ],
    )

    results = store.search([0.0, 1.0, 0.0], top_k=1)

    assert len(results) == 1
    assert results[0].chunk.text == "MySQL"
    assert results[0].score == pytest.approx(1.0)


def test_vector_store_respects_top_k() -> None:
    store = InMemoryVectorStore()

    store.add(
        criar_chunks(),
        [
            [1.0, 0.0],
            [0.5, 0.5],
            [0.0, 1.0],
        ],
    )

    results = store.search([1.0, 0.0], top_k=2)

    assert len(results) == 2


def test_vector_store_returns_empty_when_no_chunks() -> None:
    store = InMemoryVectorStore()

    assert store.search([1.0, 0.0]) == []


def test_vector_store_rejects_inconsistent_dimensions() -> None:
    store = InMemoryVectorStore()

    with pytest.raises(ValueError):
        store.add(
            criar_chunks(),
            [[1.0, 0.0]],
        )


def test_vector_store_rejects_invalid_top_k() -> None:
    store = InMemoryVectorStore()

    with pytest.raises(ValueError):
        store.search([1.0, 0.0], top_k=0)


def test_vector_store_rejects_zero_vector() -> None:
    store = InMemoryVectorStore()

    with pytest.raises(ValueError):
        store.add(
            criar_chunks()[:1],
            [[0.0, 0.0]],
        )