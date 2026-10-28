import pytest
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Alternativa, Geracao, Questao, StatusGeracao


@pytest.fixture()
def session():
    engine = create_engine("sqlite://")

    @event.listens_for(engine, "connect")
    def ativar_chaves_estrangeiras(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s
    engine.dispose()


def _montar_geracao() -> Geracao:
    return Geracao(
        texto_base="A fotossintese converte energia luminosa em energia quimica.",
        parametros={"quantidade_questoes": 2, "dificuldade": "media", "alternativas": 3},
        questoes=[
            Questao(
                nome=f"Questao-{numero}",
                enunciado=f"Pergunta {numero}?",
                categoria="Biologia/Fotossintese" if numero == 1 else None,
                tipo="multipla_escolha",
                alternativas=[
                    Alternativa(texto="Correta", correta=True, justificativa="Esta e a certa."),
                    Alternativa(texto="Errada A", correta=False, justificativa="Nao se aplica."),
                    Alternativa(texto="Errada B", correta=False, justificativa="Nao se aplica."),
                ],
            )
            for numero in (1, 2)
        ],
    )


def _contar(session: Session, modelo) -> int:
    return session.scalar(select(func.count()).select_from(modelo))


def test_fluxo_completo_geracao_com_questoes_e_alternativas(session):
    session.add(_montar_geracao())
    session.commit()
    session.expunge_all()

    geracao = session.scalars(select(Geracao)).one()
    assert geracao.status == StatusGeracao.PENDENTE
    assert geracao.data_hora is not None
    assert geracao.parametros["dificuldade"] == "media"
    assert len(geracao.questoes) == 2

    for questao in geracao.questoes:
        assert questao.geracao is geracao
        assert len(questao.alternativas) == 3
        assert sum(a.correta for a in questao.alternativas) == 1 
        assert questao.nome.startswith("Questao-")
        assert {q.nome: q.categoria for q in geracao.questoes} == {
            "Questao-1": "Biologia/Fotossintese",
            "Questao-2": None,
        }

    geracao.status = StatusGeracao.CONCLUIDA
    session.commit()
    session.expunge_all()
    assert session.scalars(select(Geracao)).one().status == StatusGeracao.CONCLUIDA


def test_apagar_geracao_apaga_questoes_e_alternativas(session):
    session.add(_montar_geracao())
    session.commit()
    assert _contar(session, Questao) == 2
    assert _contar(session, Alternativa) == 6

    session.delete(session.scalars(select(Geracao)).one())
    session.commit()

    assert _contar(session, Geracao) == 0
    assert _contar(session, Questao) == 0
    assert _contar(session, Alternativa) == 0