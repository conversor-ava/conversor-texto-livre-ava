import pytest

from app.services.rag_service import RAGService


class FakeEmbeddingService:
    async def embed(self, texts: list[str]) -> list[list[float]]:
        vectors = []

        for text in texts:
            if "MySQL" in text or "banco" in text.lower():
                vectors.append([0.0, 1.0, 0.0])
            elif "Python" in text:
                vectors.append([1.0, 0.0, 0.0])
            else:
                vectors.append([0.0, 0.0, 1.0])

        return vectors


@pytest.mark.asyncio
async def test_rag_indexes_document() -> None:
    rag = RAGService(
        embedding_service=FakeEmbeddingService(),
        chunk_size=100,
        overlap=20,
    )

    total = await rag.index_document(
        "Python é uma linguagem de programação."
    )

    assert total == 1
    assert len(rag.chunks) == 1


@pytest.mark.asyncio
async def test_rag_retrieves_relevant_chunk() -> None:
    rag = RAGService(
        embedding_service=FakeEmbeddingService(),
        chunk_size=100,
        overlap=0,
    )

    await rag.index_document(
        "Python é uma linguagem de programação.\n\n"
        "MySQL é um banco de dados relacional."
    )

    results = await rag.retrieve(
        query="O que é um banco de dados?",
        top_k=1,
    )

    assert len(results) == 1
    assert "MySQL" in results[0].chunk.text


@pytest.mark.asyncio
async def test_rag_returns_context() -> None:
    rag = RAGService(
        embedding_service=FakeEmbeddingService(),
    )

    await rag.index_document(
        "Python é uma linguagem de programação."
    )

    context = await rag.retrieve_context(
        query="Explique Python",
        top_k=1,
    )

    assert "Python" in context


@pytest.mark.asyncio
async def test_rag_rejects_empty_query() -> None:
    rag = RAGService(
        embedding_service=FakeEmbeddingService(),
    )

    await rag.index_document("Texto de exemplo.")

    with pytest.raises(ValueError):
        await rag.retrieve("   ")


@pytest.mark.asyncio
async def test_rag_rejects_search_without_document() -> None:
    rag = RAGService(
        embedding_service=FakeEmbeddingService(),
    )

    with pytest.raises(ValueError):
        await rag.retrieve("Python")


@pytest.mark.asyncio
async def test_rag_rejects_invalid_top_k() -> None:
    rag = RAGService(
        embedding_service=FakeEmbeddingService(),
    )

    await rag.index_document("Texto de exemplo.")

    with pytest.raises(ValueError):
        await rag.retrieve("Python", top_k=0)


@pytest.mark.asyncio
async def test_rag_replaces_previous_document() -> None:
    rag = RAGService(
        embedding_service=FakeEmbeddingService(),
    )

    await rag.index_document("Python é uma linguagem.")

    await rag.index_document("MySQL é um banco de dados.")

    assert len(rag.chunks) == 1
    assert "MySQL" in rag.chunks[0].text