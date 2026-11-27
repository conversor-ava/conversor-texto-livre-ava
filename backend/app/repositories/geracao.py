import logging
from collections.abc import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Alternativa, Geracao, Questao, StatusGeracao
from app.schemas import QuestionSetSchema

logger = logging.getLogger(__name__)


def montar_geracao(*, texto_base: str, parametros: dict, conjunto: QuestionSetSchema) -> Geracao:
    questoes = []

    for questao in conjunto.questions:
        alternativas = [
            Alternativa(
                texto=resposta.text,
                correta=resposta.is_correct,
                justificativa=resposta.feedback,
            )
            for resposta in questao.answers
        ]
        questoes.append(
            Questao(
                nome=questao.name,
                enunciado=questao.text,
                categoria=questao.category,
                feedback_geral=questao.general_feedback,
                alternativas=alternativas,
            )
        )

    return Geracao(
        texto_base=texto_base,
        parametros=dict(parametros),
        status=StatusGeracao.CONCLUIDA,
        questoes=questoes,
    )


async def salvar_geracao(
    session: AsyncSession, *, texto_base: str, parametros: dict, conjunto: QuestionSetSchema
) -> Geracao:
    geracao = montar_geracao(texto_base=texto_base, parametros=parametros, conjunto=conjunto)
    session.add(geracao)
    await session.commit()
    return geracao


async def registrar_falha(
    session: AsyncSession, *, texto_base: str, parametros: dict
) -> Geracao:
    geracao = Geracao(
        texto_base=texto_base,
        parametros=dict(parametros),
        status=StatusGeracao.FALHA,
    )
    session.add(geracao)
    await session.commit()
    return geracao


async def _executar_persistencia_best_effort(
    operacao: Callable[[AsyncSession], Awaitable[Geracao]],
    contexto: str,
) -> bool:
    from app.db import session as db_session

    session_factory = db_session.AsyncSessionLocal
    if session_factory is None:
        logger.warning(
            "Persistência em banco ignorada (%s): DATABASE_URL não configurada.",
            contexto,
        )
        return False

    try:
        async with session_factory() as session:
            await operacao(session)
        return True
    except Exception:
        logger.warning(
            "Falha ao persistir %s no MySQL; seguindo sem persistência.",
            contexto,
            exc_info=True,
        )
        return False


async def persistir_geracao_best_effort(
    *, texto_base: str, parametros: dict, conjunto: QuestionSetSchema
) -> bool:
    return await _executar_persistencia_best_effort(
        lambda session: salvar_geracao(
            session,
            texto_base=texto_base,
            parametros=parametros,
            conjunto=conjunto,
        ),
        "geração concluída",
    )


async def persistir_falha_best_effort(
    *, texto_base: str, parametros: dict
) -> bool:
    return await _executar_persistencia_best_effort(
        lambda session: registrar_falha(
            session,
            texto_base=texto_base,
            parametros=parametros,
        ),
        "falha na geração",
    )