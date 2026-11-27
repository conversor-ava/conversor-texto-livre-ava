import json
import re

from app.llm.base import LLMProvider
from app.schemas import QuestionSchema, QuestionSetSchema
from app.services.prompt_builder import build_question_prompt

MAX_QUESTIONS_PER_BATCH = 5


def _remove_markdown_fence(texto: str) -> str:
    texto = texto.strip()

    match = re.fullmatch(
        r"```(?:json)?\s*\n(.*?)\n```",
        texto,
        flags=re.DOTALL | re.IGNORECASE,
    )

    if match:
        return match.group(1).strip()

    return texto


def _extract_json_payload(texto: str) -> str:
    limpo = _remove_markdown_fence(texto)

    try:
        json.loads(limpo)
        return limpo
    except ValueError:
        pass

    fence_match = re.search(
        r"```(?:json)?\s*\n(.*?)\n```",
        limpo,
        flags=re.DOTALL | re.IGNORECASE,
    )
    if fence_match:
        candidato = fence_match.group(1).strip()
        try:
            json.loads(candidato)
            return candidato
        except ValueError:
            pass

    inicio = limpo.find("{")
    if inicio != -1:
        profundidade = 0
        em_string = False
        escapado = False
        for indice in range(inicio, len(limpo)):
            caractere = limpo[indice]
            if escapado:
                escapado = False
                continue
            if caractere == "\\" and em_string:
                escapado = True
                continue
            if caractere == '"':
                em_string = not em_string
                continue
            if not em_string:
                if caractere == "{":
                    profundidade += 1
                elif caractere == "}":
                    profundidade -= 1
                    if profundidade == 0:
                        candidato = limpo[inicio : indice + 1]
                        try:
                            json.loads(candidato)
                            return candidato
                        except ValueError:
                            break

    return limpo


async def _generate_batch(
    texto: str,
    quantidade: int,
    dificuldade: str,
    alternativas: int,
    provider: LLMProvider,
    questoes_evitar: list[str] | None = None,
) -> QuestionSetSchema:
    prompt = build_question_prompt(
        texto=texto,
        quantidade=quantidade,
        dificuldade=dificuldade,
        alternativas=alternativas,
        questoes_evitar=questoes_evitar,
    )

    resposta = await provider.generate(prompt)
    payload = _extract_json_payload(resposta)

    return QuestionSetSchema.model_validate_json(
        payload,
        context={
            "quantidade_questoes": quantidade,
            "quantidade_alternativas": alternativas,
        },
    )


async def suggest_questions(
    texto: str,
    quantidade: int,
    dificuldade: str,
    alternativas: int,
    provider: LLMProvider,
) -> QuestionSetSchema:
    if quantidade <= MAX_QUESTIONS_PER_BATCH:
        return await _generate_batch(
            texto=texto,
            quantidade=quantidade,
            dificuldade=dificuldade,
            alternativas=alternativas,
            provider=provider,
        )

    build_question_prompt(
        texto=texto,
        quantidade=quantidade,
        dificuldade=dificuldade,
        alternativas=alternativas,
    )

    questoes_acumuladas: list[QuestionSchema] = []
    restante = quantidade

    while restante > 0:
        lote = min(restante, MAX_QUESTIONS_PER_BATCH)
        questoes_evitar = [
            f"{questao.name}: {questao.text}"
            for questao in questoes_acumuladas
        ]
        resultado_lote = await _generate_batch(
            texto=texto,
            quantidade=lote,
            dificuldade=dificuldade,
            alternativas=alternativas,
            provider=provider,
            questoes_evitar=questoes_evitar,
        )
        questoes_acumuladas.extend(resultado_lote.questions)
        restante -= lote

    return QuestionSetSchema.model_validate(
        {"questions": [questao.model_dump() for questao in questoes_acumuladas]},
        context={
            "quantidade_questoes": quantidade,
            "quantidade_alternativas": alternativas,
        },
    )