import pytest
from pydantic import ValidationError

from app.schemas import AnswerSchema, QuestionSchema, QuestionSetSchema


def _alternativas_validas() -> list[dict]:
    return [
        {"text": "Paris", "is_correct": True},
        {"text": "Londres", "is_correct": False},
        {"text": "Berlim", "is_correct": False},
    ]

def test_questao_valida_e_aceita() -> None:
    questao = QuestionSchema(
        name="capital-franca",
        text="Qual e a capital da Franca?",
        answers=_alternativas_validas(),
    )

    assert questao.name == "capital-franca"
    assert len(questao.answers) == 3
    assert sum(1 for a in questao.answers if a.is_correct) == 1
    assert questao.category is None


def test_questao_aceita_category_opcional() -> None:
    questao = QuestionSchema(
        name="capital-franca",
        text="Qual e a capital da Franca?",
        answers=_alternativas_validas(),
        category="Geografia/Europa",
    )

    assert questao.category == "Geografia/Europa"