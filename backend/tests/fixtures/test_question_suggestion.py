import json

import pytest
from pydantic import ValidationError

from app.llm.base import LLMProvider
from app.services.question_suggestion import (
    _remove_markdown_fence,
    suggest_questions,
)


class FakeProvider(LLMProvider):
    def __init__(self, response: str):
        self.response = response
        self.prompts = []

    async def generate(self, prompt: str) -> str:
        self.prompts.append(prompt)
        return self.response


def criar_resposta(
    quantidade: int = 1,
    alternativas: int = 4,
) -> str:
    questions = []

    for indice in range(quantidade):
        answers = []

        for alternativa in range(alternativas):
            answers.append(
                {
                    "text": f"Alternativa {alternativa + 1}",
                    "is_correct": alternativa == 0,
                    "feedback": "Justificativa",
                }
            )

        questions.append(
            {
                "name": f"Questão {indice + 1}",
                "text": "Qual conceito aparece no texto?",
                "answers": answers,
                "general_feedback": "Explicação geral",
                "category": None,
            }
        )

    return json.dumps({"questions": questions})


@pytest.mark.asyncio
async def test_suggest_questions_returns_valid_questions() -> None:
    provider = FakeProvider(criar_resposta())

    result = await suggest_questions(
        texto="Python é uma linguagem de programação.",
        quantidade=1,
        dificuldade="facil",
        alternativas=4,
        provider=provider,
    )

    assert len(result.questions) == 1
    assert len(result.questions[0].answers) == 4
    assert result.questions[0].answers[0].is_correct is True
    assert len(provider.prompts) == 1
    assert "Python é uma linguagem de programação." in provider.prompts[0]


@pytest.mark.asyncio
async def test_suggest_questions_rejects_wrong_question_count() -> None:
    provider = FakeProvider(criar_resposta(quantidade=1))

    with pytest.raises(ValidationError):
        await suggest_questions(
            texto="Texto de exemplo",
            quantidade=2,
            dificuldade="medio",
            alternativas=4,
            provider=provider,
        )


@pytest.mark.asyncio
async def test_suggest_questions_rejects_wrong_answer_count() -> None:
    provider = FakeProvider(criar_resposta(alternativas=3))

    with pytest.raises(ValidationError):
        await suggest_questions(
            texto="Texto de exemplo",
            quantidade=1,
            dificuldade="medio",
            alternativas=4,
            provider=provider,
        )


@pytest.mark.asyncio
async def test_suggest_questions_rejects_invalid_json() -> None:
    provider = FakeProvider("resposta inválida")

    with pytest.raises(ValidationError):
        await suggest_questions(
            texto="Texto de exemplo",
            quantidade=1,
            dificuldade="medio",
            alternativas=4,
            provider=provider,
        )


@pytest.mark.asyncio
async def test_suggest_questions_rejects_invalid_parameters() -> None:
    provider = FakeProvider(criar_resposta())

    with pytest.raises(ValueError):
        await suggest_questions(
            texto="Texto de exemplo",
            quantidade=1,
            dificuldade="inexistente",
            alternativas=4,
            provider=provider,
        )

    assert provider.prompts == []


@pytest.mark.asyncio
async def test_suggest_questions_accepts_json_markdown() -> None:
    resposta = f"```json\n{criar_resposta()}\n```"
    provider = FakeProvider(resposta)

    result = await suggest_questions(
        texto="Python é uma linguagem de programação.",
        quantidade=1,
        dificuldade="facil",
        alternativas=4,
        provider=provider,
    )

    assert len(result.questions) == 1
    assert len(result.questions[0].answers) == 4
    assert all(answer.feedback for answer in result.questions[0].answers)


@pytest.mark.asyncio
async def test_suggest_questions_accepts_markdown_without_language() -> None:
    resposta = f"```\n{criar_resposta()}\n```"
    provider = FakeProvider(resposta)

    result = await suggest_questions(
        texto="Python é uma linguagem de programação.",
        quantidade=1,
        dificuldade="facil",
        alternativas=4,
        provider=provider,
    )

    assert len(result.questions) == 1
    assert len(result.questions[0].answers) == 4


@pytest.mark.asyncio
async def test_suggest_questions_rejects_missing_feedback() -> None:
    resposta = json.loads(criar_resposta())
    del resposta["questions"][0]["answers"][0]["feedback"]

    provider = FakeProvider(json.dumps(resposta))

    with pytest.raises(ValidationError):
        await suggest_questions(
            texto="Python é uma linguagem de programação.",
            quantidade=1,
            dificuldade="facil",
            alternativas=4,
            provider=provider,
        )


@pytest.mark.parametrize(
    ("resposta", "esperado"),
    [
        (
            '{"questions":[]}',
            '{"questions":[]}',
        ),
        (
            '```json\n{"questions":[]}\n```',
            '{"questions":[]}',
        ),
        (
            '```\n{"questions":[]}\n```',
            '{"questions":[]}',
        ),
        (
            '  ```JSON\n{"questions":[]}\n```  ',
            '{"questions":[]}',
        ),
    ],
)
def test_remove_markdown_fence(
    resposta: str,
    esperado: str,
) -> None:
    assert _remove_markdown_fence(resposta) == esperado


def test_remove_markdown_fence_preserves_invalid_content() -> None:
    resposta = "Resposta inválida"

    assert _remove_markdown_fence(resposta) == resposta


def test_remove_markdown_fence_preserves_extra_text() -> None:
    resposta = 'Explicação:\n```json\n{"questions":[]}\n```'

    assert _remove_markdown_fence(resposta) == resposta