import xml.etree.ElementTree as ET
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.llm.base import LLMGenerationError
from app.main import app
from app.schemas import QuestionSetSchema

client = TestClient(app)


def criar_questao_valida() -> dict:
    return {
        "questions": [
            {
                "name": "Capital do Brasil",
                "text": "Qual é a capital do Brasil?",
                "answers": [
                    {
                        "text": "Brasília",
                        "is_correct": True,
                    },
                    {
                        "text": "Rio de Janeiro",
                        "is_correct": False,
                    },
                ],
                "general_feedback": "Brasília é a capital do Brasil.",
                "category": "Geografia",
            }
        ]
    }


def test_health_check_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_app_metadata() -> None:
    assert app.title == "Conversor Inteligente Texto Livre para AVA"


def test_convert_returns_valid_moodle_xml() -> None:
    response = client.post("/api/convert", json=criar_questao_valida())

    assert response.status_code == 200
    assert "application/xml" in response.headers["content-type"]
    assert "questoes_moodle.xml" in response.headers["content-disposition"]

    root = ET.fromstring(response.content)

    assert root.tag == "quiz"

    question = root.find("./question[@type='multichoice']")

    assert question is not None
    assert question.findtext("./name/text") == "Capital do Brasil"
    assert question.findtext("./generalfeedback/text") == (
        "Brasília é a capital do Brasil."
    )

    answers = question.findall("answer")

    assert len(answers) == 2
    assert sum(answer.get("fraction") == "100" for answer in answers) == 1


def test_convert_rejects_question_without_correct_answer() -> None:
    payload = criar_questao_valida()

    for answer in payload["questions"][0]["answers"]:
        answer["is_correct"] = False

    response = client.post("/api/convert", json=payload)

    assert response.status_code == 422


def test_convert_does_not_depend_on_ollama_or_database() -> None:
    with (
        patch(
            "app.llm.providers.ollama.OllamaProvider.generate",
            side_effect=AssertionError("Ollama não deveria ser utilizado"),
        ),
        patch(
            "sqlalchemy.ext.asyncio.AsyncEngine.connect",
            side_effect=AssertionError("MySQL não deveria ser utilizado"),
        ),
    ):
        response = client.post("/api/convert", json=criar_questao_valida())

    assert response.status_code == 200
    assert ET.fromstring(response.content).tag == "quiz"


def test_suggestions_returns_valid_questions() -> None:
    question_set = QuestionSetSchema.model_validate(criar_questao_valida())

    with patch(
        "app.main.suggest_questions",
        new_callable=AsyncMock,
        return_value=question_set,
    ) as mock_suggest:
        response = client.post(
            "/api/suggestions",
            json={
                "texto": "Python é uma linguagem de programação.",
                "quantidade": 1,
                "dificuldade": "facil",
                "alternativas": 2,
            },
        )

    assert response.status_code == 200
    assert len(response.json()["questions"]) == 1
    mock_suggest.assert_awaited_once()


def test_suggestions_rejects_invalid_parameters() -> None:
    response = client.post(
        "/api/suggestions",
        json={
            "texto": "Texto de exemplo",
            "quantidade": 0,
            "dificuldade": "facil",
            "alternativas": 4,
        },
    )

    assert response.status_code == 422


def test_suggestions_handles_invalid_ai_response() -> None:
    try:
        QuestionSetSchema.model_validate({"questions": []})
    except ValidationError as exc:
        validation_error = exc

    with patch(
        "app.main.suggest_questions",
        new_callable=AsyncMock,
        side_effect=validation_error,
    ):
        response = client.post(
            "/api/suggestions",
            json={"texto": "Texto de exemplo"},
        )

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "A IA retornou sugestões em formato inválido."
    )


def test_suggestions_handles_ollama_unavailable() -> None:
    with patch(
        "app.main.suggest_questions",
        new_callable=AsyncMock,
        side_effect=LLMGenerationError("Ollama indisponível"),
    ):
        response = client.post(
            "/api/suggestions",
            json={"texto": "Texto de exemplo"},
        )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Serviço de sugestões indisponível."
    )