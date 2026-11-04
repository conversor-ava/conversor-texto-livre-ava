import pytest
import pytest_asyncio
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.models import Alternativa, Geracao, Questao, StatusGeracao
from app.repositories.geracao import montar_geracao, registrar_falha, salvar_geracao
from app.schemas import QuestionSetSchema

PARAMETROS = {"modo": "simples", "quantidade": 2, "dificuldade": "medio", "alternativas": 3}


def _criar_conjunto() -> QuestionSetSchema:
    return QuestionSetSchema.model_validate(
        {
            "questions": [
                {
                    "name": "Fotossintese 1",
                    "text": "Qual organela realiza a fotossintese?",
                    "category": "Biologia/Fotossintese",
                    "general_feedback": "Revise o papel dos cloroplastos.",
                    "answers": [
                        {"text": "Mitocondria", "is_correct": False,
                         "feedback": "A mitocondria faz respiracao celular."},
                        {"text": "Cloroplasto", "is_correct": True,
                         "feedback": "O cloroplasto contem clorofila."},
                        {"text": "Ribossomo", "is_correct": False,
                         "feedback": "O ribossomo sintetiza proteinas."},
                    ],
                },
                {
                    "name": "Fotossintese 2",
                    "text": "Qual gas e absorvido na fotossintese?",
                    "category": None,
                    "general_feedback": None,
                    "answers": [
                        {"text": "Oxigenio", "is_correct": False,
                         "feedback": "O oxigenio e liberado."},
                        {"text": "Nitrogenio", "is_correct": False,
                         "feedback": "Nao participa diretamente."},
                        {"text": "Gas carbonico", "is_correct": True,
                         "feedback": "O CO2 e a fonte de carbono."},
                    ],
                },
            ]
        }
    )


@pytest_asyncio.fixture
async def fabrica():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


async def _contar(sessao, modelo) -> int:
    return await sessao.scalar(select(func.count()).select_from(modelo))


def test_montar_geracao_mapeia_campos_da_questao():
    geracao = montar_geracao(
        texto_base="texto base", parametros=PARAMETROS, conjunto=_criar_conjunto()
    )
    primeira, segunda = geracao.questoes

    assert geracao.texto_base == "texto base"

    assert primeira.nome == "Fotossintese 1"
    assert primeira.enunciado == "Qual organela realiza a fotossintese?"
    assert primeira.categoria == "Biologia/Fotossintese"
    assert primeira.feedback_geral == "Revise o papel dos cloroplastos."

    assert segunda.nome == "Fotossintese 2"
    assert segunda.enunciado == "Qual gas e absorvido na fotossintese?"
    assert segunda.categoria is None
    assert segunda.feedback_geral is None


def test_montar_geracao_mapeia_campos_das_alternativas():
    geracao = montar_geracao(
        texto_base="texto", parametros=PARAMETROS, conjunto=_criar_conjunto()
    )
    primeira, segunda = geracao.questoes

    assert [(a.texto, a.correta, a.justificativa) for a in primeira.alternativas] == [
        ("Mitocondria", False, "A mitocondria faz respiracao celular."),
        ("Cloroplasto", True, "O cloroplasto contem clorofila."),
        ("Ribossomo", False, "O ribossomo sintetiza proteinas."),
    ]
    assert [(a.texto, a.correta, a.justificativa) for a in segunda.alternativas] == [
        ("Oxigenio", False, "O oxigenio e liberado."),
        ("Nitrogenio", False, "Nao participa diretamente."),
        ("Gas carbonico", True, "O CO2 e a fonte de carbono."),
    ]


def test_montar_geracao_define_status_concluida():
    geracao = montar_geracao(
        texto_base="texto", parametros=PARAMETROS, conjunto=_criar_conjunto()
    )

    assert geracao.status == StatusGeracao.CONCLUIDA


def test_montar_geracao_copia_parametros():
    parametros = dict(PARAMETROS)
    geracao = montar_geracao(
        texto_base="texto", parametros=parametros, conjunto=_criar_conjunto()
    )

    parametros["quantidade"] = 99

    assert geracao.parametros == PARAMETROS
    assert geracao.parametros is not parametros


def test_montar_geracao_preserva_a_ordem():
    geracao = montar_geracao(
        texto_base="texto", parametros=PARAMETROS, conjunto=_criar_conjunto()
    )

    assert [q.nome for q in geracao.questoes] == ["Fotossintese 1", "Fotossintese 2"]
    assert [a.texto for a in geracao.questoes[0].alternativas] == [
        "Mitocondria",
        "Cloroplasto",
        "Ribossomo",
    ]
    assert [a.texto for a in geracao.questoes[1].alternativas] == [
        "Oxigenio",
        "Nitrogenio",
        "Gas carbonico",
    ]


@pytest.mark.asyncio
async def test_salvar_geracao_grava_tudo(fabrica):
    async with fabrica() as sessao:
        geracao = await salvar_geracao(
            sessao, texto_base="texto", parametros=PARAMETROS, conjunto=_criar_conjunto()
        )
        assert geracao.id is not None

    async with fabrica() as nova:
        assert await _contar(nova, Geracao) == 1
        assert await _contar(nova, Questao) == 2
        assert await _contar(nova, Alternativa) == 6

        gravada = (await nova.scalars(select(Geracao))).one()
        assert gravada.status == StatusGeracao.CONCLUIDA
        assert gravada.texto_base == "texto"
        assert gravada.parametros == PARAMETROS

        tipos = (await nova.scalars(select(Questao.tipo))).all()
        assert tipos == ["multipla_escolha", "multipla_escolha"]


@pytest.mark.asyncio
async def test_registrar_falha_grava_sem_questoes(fabrica):
    async with fabrica() as sessao:
        geracao = await registrar_falha(
            sessao, texto_base="texto", parametros=PARAMETROS
        )
        assert geracao.id is not None

    async with fabrica() as nova:
        gravada = (await nova.scalars(select(Geracao))).one()
        assert gravada.status == StatusGeracao.FALHA
        assert gravada.texto_base == "texto"
        assert gravada.parametros == PARAMETROS
        assert await _contar(nova, Questao) == 0