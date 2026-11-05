from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Alternativa, Geracao, Questao, StatusGeracao
from app.schemas import QuestionSetSchema


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