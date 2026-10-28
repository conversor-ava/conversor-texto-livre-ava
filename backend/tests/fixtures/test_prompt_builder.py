
    
  
import pytest

from app.services.prompt_builder import build_question_prompt


TEXTO_BASE = "A fotossíntese utiliza energia luminosa para produzir compostos orgânicos."


@pytest.mark.parametrize(
    ("dificuldade", "descricao"),
    [
        ("facil", "compreensão básica"),
        ("medio", "interpretação"),
        ("dificil", "análise crítica"),
    ],
)
def test_prompt_contem_instrucao_da_dificuldade(dificuldade: str, descricao: str) -> None:
    prompt = build_question_prompt(TEXTO_BASE, dificuldade=dificuldade)

    assert descricao in prompt


def test_prompt_inclui_texto_e_parametros() -> None:
    prompt = build_question_prompt(
        texto=TEXTO_BASE,
        quantidade=3,
        dificuldade="medio",
        alternativas=4,
    )

    assert TEXTO_BASE in prompt
    assert "exatamente 3 questões" in prompt
    assert "exatamente 4 alternativas" in prompt
    assert '"questions"' in prompt
    assert '"answers"' in prompt
    assert '"is_correct"' in prompt


def test_prompt_solicita_json_sem_xml() -> None:
    prompt = build_question_prompt(TEXTO_BASE)

    assert "Retorne exclusivamente um objeto JSON válido" in prompt
    assert "Não gere XML" in prompt
    assert "Apenas um objeto de answers deve possuir is_correct igual a true" in prompt


@pytest.mark.parametrize("texto", ["", "   ", "\n\t"])
def test_rejeita_texto_vazio(texto: str) -> None:
    with pytest.raises(ValueError, match="texto-base não pode estar vazio"):
        build_question_prompt(texto)


@pytest.mark.parametrize("quantidade", [0, -1, 21])
def test_rejeita_quantidade_de_questoes_invalida(quantidade: int) -> None:
    with pytest.raises(ValueError, match="quantidade de questões"):
        build_question_prompt(TEXTO_BASE, quantidade=quantidade)


@pytest.mark.parametrize("alternativas", [0, 1, 9])
def test_rejeita_quantidade_de_alternativas_invalida(alternativas: int) -> None:
    with pytest.raises(ValueError, match="quantidade de alternativas"):
        build_question_prompt(TEXTO_BASE, alternativas=alternativas)


@pytest.mark.parametrize("dificuldade", ["avancado", "", "iniciante"])
def test_rejeita_dificuldade_invalida(dificuldade: str) -> None:
    with pytest.raises(ValueError, match="inválido"):
        build_question_prompt(TEXTO_BASE, dificuldade=dificuldade)


def test_normaliza_texto_e_dificuldade() -> None:
    prompt = build_question_prompt(
        texto=f"  {TEXTO_BASE}  ",
        dificuldade=" MEDIO ",
    )

    assert TEXTO_BASE in prompt
    assert "interpretação" in prompt


@pytest.mark.parametrize("alternativas", [2, 8])
def test_aceita_limites_de_alternativas(alternativas: int) -> None:
    prompt = build_question_prompt(TEXTO_BASE, alternativas=alternativas)

    assert f"exatamente {alternativas} alternativas" in prompt


@pytest.mark.parametrize("quantidade", [1, 20])
def test_aceita_limites_de_questoes(quantidade: int) -> None:
    prompt = build_question_prompt(TEXTO_BASE, quantidade=quantidade)

    assert f"exatamente {quantidade} questões" in prompt

