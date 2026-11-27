from unittest.mock import AsyncMock, Mock, sentinel

import pytest

from app.services.rag_suggestion_service import suggest_questions_with_rag


@pytest.mark.asyncio
async def test_rag_suggestion_success(
    monkeypatch: pytest.MonkeyPatch,
) -> None:

    rag = Mock()
    rag.index_document = AsyncMock(return_value=2)
    rag.retrieve_context = AsyncMock(
        return_value="MySQL é um banco de dados relacional."
    )

    provider = Mock()

    suggest_mock = AsyncMock(
        return_value=sentinel.question_set
    )

    monkeypatch.setattr(
        "app.services.rag_suggestion_service.suggest_questions",
        suggest_mock,
    )

    result = await suggest_questions_with_rag(
        texto="Documento completo sobre Python e MySQL.",
        tema="Bancos de dados",
        quantidade=3,
        dificuldade="medio",
        alternativas=4,
        rag=rag,
        provider=provider,
    )

    assert result is sentinel.question_set

    rag.index_document.assert_awaited_once_with(
        "Documento completo sobre Python e MySQL."
    )

    rag.retrieve_context.assert_awaited_once_with(
        query="Bancos de dados",
        top_k=3,
    )

    suggest_mock.assert_awaited_once_with(
        texto="MySQL é um banco de dados relacional.",
        quantidade=3,
        dificuldade="medio",
        alternativas=4,
        provider=provider,
    )


@pytest.mark.asyncio
async def test_rag_suggestion_rejects_empty_document() -> None:

    rag = Mock()
    provider = Mock()

    with pytest.raises(ValueError):
        await suggest_questions_with_rag(
            texto="   ",
            tema="Python",
            quantidade=2,
            dificuldade="facil",
            alternativas=4,
            rag=rag,
            provider=provider,
        )

    rag.index_document.assert_not_called()


@pytest.mark.asyncio
async def test_rag_suggestion_rejects_empty_topic() -> None:

    rag = Mock()
    provider = Mock()

    with pytest.raises(ValueError):
        await suggest_questions_with_rag(
            texto="Python é uma linguagem.",
            tema="   ",
            quantidade=2,
            dificuldade="facil",
            alternativas=4,
            rag=rag,
            provider=provider,
        )

    rag.index_document.assert_not_called()


@pytest.mark.asyncio
async def test_rag_suggestion_rejects_empty_context(
    monkeypatch: pytest.MonkeyPatch,
) -> None:

    rag = Mock()
    rag.index_document = AsyncMock(return_value=1)
    rag.retrieve_context = AsyncMock(return_value="   ")

    provider = Mock()

    suggest_mock = AsyncMock()

    monkeypatch.setattr(
        "app.services.rag_suggestion_service.suggest_questions",
        suggest_mock,
    )

    with pytest.raises(ValueError):
        await suggest_questions_with_rag(
            texto="Documento de exemplo.",
            tema="Python",
            quantidade=2,
            dificuldade="facil",
            alternativas=4,
            rag=rag,
            provider=provider,
        )

    suggest_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_rag_suggestion_respects_top_k(
    monkeypatch: pytest.MonkeyPatch,
) -> None:

    rag = Mock()
    rag.index_document = AsyncMock(return_value=5)
    rag.retrieve_context = AsyncMock(
        return_value="Contexto recuperado."
    )

    provider = Mock()

    suggest_mock = AsyncMock(
        return_value=sentinel.question_set
    )

    monkeypatch.setattr(
        "app.services.rag_suggestion_service.suggest_questions",
        suggest_mock,
    )

    await suggest_questions_with_rag(
        texto="Documento completo.",
        tema="Engenharia de Software",
        quantidade=2,
        dificuldade="dificil",
        alternativas=5,
        rag=rag,
        provider=provider,
        top_k=2,
    )

    rag.retrieve_context.assert_awaited_once_with(
        query="Engenharia de Software",
        top_k=2,
    )


@pytest.mark.asyncio
async def test_rag_suggestion_rejects_invalid_top_k() -> None:

    rag = Mock()
    provider = Mock()

    with pytest.raises(ValueError):
        await suggest_questions_with_rag(
            texto="Documento válido.",
            tema="Python",
            quantidade=2,
            dificuldade="medio",
            alternativas=4,
            rag=rag,
            provider=provider,
            top_k=0,
        )

    rag.index_document.assert_not_called()