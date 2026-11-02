from app.llm.base import LLMProvider
from app.schemas import QuestionSetSchema
from app.services.question_suggestion import suggest_questions
from app.services.rag_service import RAGService


async def suggest_questions_with_rag(
    texto: str,
    tema: str,
    quantidade: int,
    dificuldade: str,
    alternativas: int,
    rag: RAGService,
    provider: LLMProvider,
    top_k: int = 3,
) -> QuestionSetSchema:

    texto = texto.strip()
    tema = tema.strip()

    if not texto:
        raise ValueError("O texto do documento não pode estar vazio.")

    if not tema:
        raise ValueError("O tema não pode estar vazio.")

    if top_k <= 0:
        raise ValueError("top_k deve ser maior que zero.")

    await rag.index_document(texto)

    contexto = await rag.retrieve_context(
        query=tema,
        top_k=top_k,
    )

    if not contexto.strip():
        raise ValueError(
            "Nenhum contexto relevante foi recuperado."
        )

    return await suggest_questions(
        texto=contexto,
        quantidade=quantidade,
        dificuldade=dificuldade,
        alternativas=alternativas,
        provider=provider,
    )