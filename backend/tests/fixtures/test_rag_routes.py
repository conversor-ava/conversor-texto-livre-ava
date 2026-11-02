from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas import QuestionSetSchema
from app.services.embedding_service import EmbeddingError


client = TestClient(app)


def criar_payload() -> dict:
    return {
        "texto": "Python é uma linguagem de programação.",
        "tema": "Python",
        "quantidade": 1,
        "dificuldade": "facil",
        "alternativas": 2,
        "top_k": 1,
    }


def criar_question_set() -> QuestionSetSchema:
    return QuestionSetSchema(
        questions=[
            {
                "name": "Questão 1",
                "text": "O que é Python?",
                "answers": [
                    {
                        "text": "Uma linguagem de programação",
                        "is_correct": True,
                        "feedback": "Python é uma linguagem de programação.",
                    },
                    {
                        "text": "Um banco de dados",
                        "is_correct": False,
                        "feedback": "Python não é um banco de dados.",
                    },
                ],
                "category": None,
            }
        ]
    )


def test_rag_endpoint_success(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    suggestion_mock = AsyncMock(return_value=criar_question_set())

    monkeypatch.setattr(
        "app.api.rag_routes.suggest_questions_with_rag",
        suggestion_mock,
    )

    response = client.post(
        "/api/rag/suggestions",
        json=criar_payload(),
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["questions"]) == 1
    assert len(data["questions"][0]["answers"]) == 2

    suggestion_mock.assert_awaited_once()

    assert suggestion_mock.await_args.kwargs["tema"] == "Python"
    assert suggestion_mock.await_args.kwargs["top_k"] == 1


def test_rag_endpoint_rejects_empty_text() -> None:
    payload = criar_payload()
    payload["texto"] = ""

    response = client.post(
        "/api/rag/suggestions",
        json=payload,
    )

    assert response.status_code == 422


def test_rag_endpoint_rejects_invalid_top_k() -> None:
    payload = criar_payload()
    payload["top_k"] = 0

    response = client.post(
        "/api/rag/suggestions",
        json=payload,
    )

    assert response.status_code == 422


def test_rag_endpoint_handles_embedding_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    suggestion_mock = AsyncMock(
        side_effect=EmbeddingError("Falha no modelo de embeddings.")
    )

    monkeypatch.setattr(
        "app.api.rag_routes.suggest_questions_with_rag",
        suggestion_mock,
    )

    response = client.post(
        "/api/rag/suggestions",
        json=criar_payload(),
    )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Serviço de sugestões com RAG indisponível."
    )


def test_rag_endpoint_handles_invalid_ai_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    try:
        QuestionSetSchema.model_validate(
            {
                "questions": [
                    {
                        "name": "Questão inválida",
                        "text": "Pergunta?",
                        "answers": [
                            {
                                "text": "A",
                                "is_correct": True,
                            },
                            {
                                "text": "B",
                                "is_correct": False,
                            },
                        ],
                    }
                ]
            }
        )
    except ValidationError as exc:
        validation_error = exc
    else:
        pytest.fail("O schema deveria rejeitar feedback ausente.")

    suggestion_mock = AsyncMock(side_effect=validation_error)

    monkeypatch.setattr(
        "app.api.rag_routes.suggest_questions_with_rag",
        suggestion_mock,
    )

    response = client.post(
        "/api/rag/suggestions",
        json=criar_payload(),
    )

    assert response.status_code == 502