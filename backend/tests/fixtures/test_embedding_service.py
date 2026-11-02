import httpx
import pytest

from app.services.embedding_service import (
    EmbeddingError,
    OllamaEmbeddingService,
)


def criar_cliente_mock(
    monkeypatch: pytest.MonkeyPatch,
    response_data: dict,
    status_code: int = 200,
) -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/embed"

        return httpx.Response(
            status_code=status_code,
            json=response_data,
        )

    client_original = httpx.AsyncClient

    def cliente_falso(*args, **kwargs):
        return client_original(
            transport=httpx.MockTransport(handler),
            **kwargs,
        )

    monkeypatch.setattr(
        "app.services.embedding_service.httpx.AsyncClient",
        cliente_falso,
    )


@pytest.mark.asyncio
async def test_embed_returns_valid_vectors(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    criar_cliente_mock(
        monkeypatch,
        {
            "embeddings": [
                [0.1, 0.2, 0.3],
                [0.4, 0.5, 0.6],
            ]
        },
    )

    service = OllamaEmbeddingService()

    result = await service.embed(["Python", "MySQL"])

    assert len(result) == 2
    assert result[0] == [0.1, 0.2, 0.3]
    assert result[1] == [0.4, 0.5, 0.6]


@pytest.mark.asyncio
async def test_embed_rejects_empty_input() -> None:
    service = OllamaEmbeddingService()

    with pytest.raises(ValueError):
        await service.embed([])


@pytest.mark.asyncio
async def test_embed_rejects_empty_text() -> None:
    service = OllamaEmbeddingService()

    with pytest.raises(ValueError):
        await service.embed(["Python", "   "])


@pytest.mark.asyncio
async def test_embed_handles_http_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    criar_cliente_mock(
        monkeypatch,
        {"error": "Modelo indisponível"},
        status_code=500,
    )

    service = OllamaEmbeddingService()

    with pytest.raises(EmbeddingError):
        await service.embed(["Python"])


@pytest.mark.asyncio
async def test_embed_rejects_missing_embeddings(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    criar_cliente_mock(monkeypatch, {})

    service = OllamaEmbeddingService()

    with pytest.raises(EmbeddingError):
        await service.embed(["Python"])


@pytest.mark.asyncio
async def test_embed_rejects_wrong_vector_count(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    criar_cliente_mock(
        monkeypatch,
        {"embeddings": [[0.1, 0.2]]},
    )

    service = OllamaEmbeddingService()

    with pytest.raises(EmbeddingError):
        await service.embed(["Python", "MySQL"])


@pytest.mark.asyncio
async def test_embed_rejects_inconsistent_dimensions(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    criar_cliente_mock(
        monkeypatch,
        {
            "embeddings": [
                [0.1, 0.2],
                [0.3, 0.4, 0.5],
            ]
        },
    )

    service = OllamaEmbeddingService()

    with pytest.raises(EmbeddingError):
        await service.embed(["Python", "MySQL"])


@pytest.mark.asyncio
async def test_embed_rejects_invalid_vector_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    criar_cliente_mock(
        monkeypatch,
        {"embeddings": [[0.1, float("nan")]]},
    )

    service = OllamaEmbeddingService()

    with pytest.raises(EmbeddingError):
        await service.embed(["Python"])