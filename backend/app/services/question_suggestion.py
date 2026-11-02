import re

from app.llm.base import LLMProvider
from app.schemas import QuestionSetSchema
from app.services.prompt_builder import build_question_prompt


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


async def suggest_questions(
    texto: str,
    quantidade: int,
    dificuldade: str,
    alternativas: int,
    provider: LLMProvider,
) -> QuestionSetSchema:
    prompt = build_question_prompt(
        texto=texto,
        quantidade=quantidade,
        dificuldade=dificuldade,
        alternativas=alternativas,
    )

    resposta = await provider.generate(prompt)

    resposta = _remove_markdown_fence(resposta)

    return QuestionSetSchema.model_validate_json(
        resposta,
        context={
            "quantidade_questoes": quantidade,
            "quantidade_alternativas": alternativas,
        },
    )