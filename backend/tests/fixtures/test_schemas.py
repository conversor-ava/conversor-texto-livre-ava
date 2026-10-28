import pytest
from pydantic import ValidationError

from app.schemas import AnswerSchema, QuestionSchema, QuestionSetSchema


def _alternativas_validas() -> list[dict]:
    return [
        {"text": "Paris", "is_correct": True},
        {"text": "Londres", "is_correct": False},
        {"text": "Berlim", "is_correct": False},
    ]


def _questao_valida() -> dict:
    return {
        "name": "capital-franca",
        "text": "Qual e a capital da Franca?",
        "answers": _alternativas_validas(),
    }


def test_questao_valida_e_aceita() -> None:
    questao = QuestionSchema(**_questao_valida())

    assert questao.name == "capital-franca"
    assert len(questao.answers) == 3
    assert sum(1 for a in questao.answers if a.is_correct) == 1
    assert questao.category is None


def test_alternativa_remove_espacos() -> None:
    alternativa = AnswerSchema(text="  Paris  ", is_correct=True)

    assert alternativa.text == "Paris"


def test_questao_aceita_category_opcional() -> None:
    questao = QuestionSchema(**_questao_valida(), category="Geografia/Europa")

    assert questao.category == "Geografia/Europa"


@pytest.mark.parametrize(
    "alternativas",
    [
        [
            {"text": "Paris", "is_correct": False},
            {"text": "Londres", "is_correct": False},
        ],
        [
            {"text": "Paris", "is_correct": True},
            {"text": "Londres", "is_correct": True},
        ],
        [
            {"text": "Paris", "is_correct": True},
            {"text": "paris", "is_correct": False},
        ],
        [
            {"text": "Paris", "is_correct": True},
            {"text": "   ", "is_correct": False},
        ],
        [
            {"text": "Paris", "is_correct": "true"},
            {"text": "Londres", "is_correct": False},
        ],
        [{"text": "Paris", "is_correct": True}],
    ],
    ids=[
        "nenhuma_correta",
        "duas_corretas",
        "alternativas_duplicadas",
        "alternativa_vazia",
        "booleano_invalido",
        "menos_de_duas_alternativas",
    ],
)
def test_questao_rejeita_alternativas_invalidas(alternativas: list[dict]) -> None:
    dados = _questao_valida()
    dados["answers"] = alternativas

    with pytest.raises(ValidationError):
        QuestionSchema.model_validate(dados)


@pytest.mark.parametrize("campo", ["name", "text"])
def test_questao_rejeita_campos_em_branco(campo: str) -> None:
    dados = _questao_valida()
    dados[campo] = "   "

    with pytest.raises(ValidationError):
        QuestionSchema.model_validate(dados)


def test_questao_rejeita_mais_de_oito_alternativas() -> None:
    dados = _questao_valida()
    dados["answers"] = [
        {"text": f"Alternativa {indice}", "is_correct": indice == 0}
        for indice in range(9)
    ]

    with pytest.raises(ValidationError):
        QuestionSchema.model_validate(dados)


@pytest.mark.parametrize(
    ("quantidade_questoes", "quantidade_alternativas"),
    [(2, 3), (1, 4), (1, 9)],
    ids=["quantidade_questoes", "quantidade_alternativas", "limite_alternativas"],
)
def test_conjunto_rejeita_parametros_incompativeis(
    quantidade_questoes: int, quantidade_alternativas: int
) -> None:
    with pytest.raises(ValidationError):
        QuestionSetSchema.model_validate(
            {"questions": [_questao_valida()]},
            context={
                "quantidade_questoes": quantidade_questoes,
                "quantidade_alternativas": quantidade_alternativas,
            },
        )


def test_conjunto_aceita_quantidades_solicitadas() -> None:
    resultado = QuestionSetSchema.model_validate(
        {"questions": [_questao_valida()]},
        context={"quantidade_questoes": 1, "quantidade_alternativas": 3},
    )

    assert len(resultado.questions) == 1
    assert len(resultado.questions[0].answers) == 3


def test_conjunto_rejeita_lista_vazia() -> None:
    with pytest.raises(ValidationError):
        QuestionSetSchema.model_validate({"questions": []})