import xml.etree.ElementTree as ET
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

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

    root = ET.fromstring(response.content)

    assert root.tag == "quiz"