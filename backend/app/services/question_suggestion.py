from app.llm.base import LLMProvider
from app.schemas import QuestionSetSchema
from app.services.prompt_builder import build_question_prompt


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

    return QuestionSetSchema.model_validate_json(
        resposta,
        context={
            "quantidade_questoes": quantidade,
            "quantidade_alternativas": alternativas,
        },
    )