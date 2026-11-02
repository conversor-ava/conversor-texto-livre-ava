import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError

from app.llm.base import LLMGenerationError
from app.llm.providers.ollama import OllamaProvider
from app.schemas import QuestionSetSchema
from app.services.embedding_service import EmbeddingError, OllamaEmbeddingService
from app.services.rag_service import RAGService
from app.services.rag_suggestion_service import suggest_questions_with_rag


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rag", tags=["rag"])


class RAGSuggestionRequest(BaseModel):
    texto: str = Field(min_length=1)
    tema: str = Field(min_length=1)
    quantidade: int = Field(default=5, ge=1, le=20)
    dificuldade: str = "medio"
    alternativas: int = Field(default=4, ge=2, le=8)
    top_k: int = Field(default=3, ge=1, le=20)


@router.post(
    "/suggestions",
    response_model=QuestionSetSchema,
)
async def generate_rag_suggestions(
    request: RAGSuggestionRequest,
) -> QuestionSetSchema:
    try:
        rag = RAGService(
            embedding_service=OllamaEmbeddingService(),
        )

        return await suggest_questions_with_rag(
            texto=request.texto,
            tema=request.tema,
            quantidade=request.quantidade,
            dificuldade=request.dificuldade,
            alternativas=request.alternativas,
            rag=rag,
            provider=OllamaProvider(),
            top_k=request.top_k,
        )

    except ValidationError as exc:
        logger.warning(
            "Resposta inválida recebida do provider de IA no RAG",
            exc_info=True,
        )

        raise HTTPException(
            status_code=502,
            detail="A IA retornou sugestões em formato inválido.",
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except (LLMGenerationError, EmbeddingError) as exc:
        logger.error(
            "Falha na comunicação com o Ollama durante o RAG",
            exc_info=True,
        )

        raise HTTPException(
            status_code=503,
            detail="Serviço de sugestões com RAG indisponível.",
        ) from exc