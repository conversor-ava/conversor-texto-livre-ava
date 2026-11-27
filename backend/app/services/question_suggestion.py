import inspect
import json
import logging
import re

from pydantic import ValidationError

from app.llm.base import LLMProvider
from app.schemas import QuestionSchema, QuestionSetSchema
from app.services.prompt_builder import build_question_prompt

logger = logging.getLogger(__name__)

MAX_QUESTIONS_PER_BATCH = 5
MAX_BATCH_RETRIES = 3


def _remove_markdown_fence(texto: str) -> str:
    texto = texto.strip()

    if texto.startswith("```") and texto.endswith("```"):
        linhas = texto.splitlines()
        if len(linhas) >= 2:
            primeira = linhas[0].strip().lower()
            if primeira in {"```", "```json"}:
                return "\n".join(linhas[1:-1]).strip()

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


async def _call_provider(
    provider: LLMProvider,
    prompt: str,
    seed: int | None = None,
) -> str:
    sig = inspect.signature(provider.generate)
    if "seed" in sig.parameters:
        return await provider.generate(prompt, seed=seed)
    return await provider.generate(prompt)


async def _generate_batch(
    texto: str,
    quantidade: int,
    dificuldade: str,
    alternativas: int,
    provider: LLMProvider,
    questoes_evitar: list[str] | None = None,
    tema: str | None = None,
    batch_index: int = 0,
) -> QuestionSetSchema:
    prompt = build_question_prompt(
        texto=texto,
        quantidade=quantidade,
        dificuldade=dificuldade,
        alternativas=alternativas,
        questoes_evitar=questoes_evitar,
        tema=tema,
    )

    ultimo_erro: ValidationError | None = None
    ultima_resposta: str | None = None

    for tentativa in range(1, MAX_BATCH_RETRIES + 1):
        seed = (batch_index * 1000) + tentativa
        resposta = await _call_provider(provider, prompt, seed=seed)
        ultima_resposta = resposta
        payload = _extract_json_payload(resposta)

        try:
            return QuestionSetSchema.model_validate_json(
                payload,
                context={
                    "quantidade_questoes": quantidade,
                    "quantidade_alternativas": alternativas,
                },
            )
        except ValidationError as exc:
            ultimo_erro = exc
            logger.warning(
                "Tentativa %d/%d do lote %d falhou na validação Pydantic.",
                tentativa,
                MAX_BATCH_RETRIES,
                batch_index + 1,
            )

    assert ultimo_erro is not None
    setattr(ultimo_erro, "raw_response", ultima_resposta)
    raise ultimo_erro


async def suggest_questions(
    texto: str,
    quantidade: int,
    dificuldade: str,
    alternativas: int,
    provider: LLMProvider,
    tema: str | None = None,
) -> QuestionSetSchema:
    if quantidade <= MAX_QUESTIONS_PER_BATCH:
        return await _generate_batch(
            texto=texto,
            quantidade=quantidade,
            dificuldade=dificuldade,
            alternativas=alternativas,
            provider=provider,
            tema=tema,
            batch_index=0,
        )

    questoes_acumuladas: list[QuestionSchema] = []
    restante = quantidade
    batch_index = 0

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
            tema=tema,
            batch_index=batch_index,
        )
        questoes_acumuladas.extend(resultado_lote.questions)
        restante -= lote
        batch_index += 1

    return QuestionSetSchema.model_validate(
        {"questions": [questao.model_dump() for questao in questoes_acumuladas]},
        context={
            "quantidade_questoes": quantidade,
            "quantidade_alternativas": alternativas,
        },
    )