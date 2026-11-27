import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError

from app.llm.base import LLMGenerationError, LLMTimeoutError
from app.llm.providers.ollama import OllamaProvider
from app.repositories.geracao import (
    persistir_falha_best_effort,
    persistir_geracao_best_effort,
)
from app.schemas import QuestionSetSchema
from app.services.embedding_service import (
    EmbeddingError,
    EmbeddingTimeoutError,
    OllamaEmbeddingService,
)
from app.services.rag_service import RAGService
from app.services.rag_suggestion_service import suggest_questions_with_rag

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rag", tags=["rag"])

MAX_RAG_CHARS = 100_000


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
    if len(request.texto) > MAX_RAG_CHARS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"O material fornecido excede o limite de {MAX_RAG_CHARS} caracteres "
                f"({len(request.texto)} enviados). Envie apenas os capítulos ou seções "
                "relacionados ao tema desejado."
            ),
        )

    parametros = {
        "modo": "rag",
        "tema": request.tema,
        "quantidade": request.quantidade,
        "dificuldade": request.dificuldade,
        "alternativas": request.alternativas,
        "top_k": request.top_k,
    }

    try:
        rag = RAGService(
            embedding_service=OllamaEmbeddingService(),
        )

        resultado = await suggest_questions_with_rag(
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
        await persistir_falha_best_effort(
            texto_base=request.texto,
            parametros=parametros,
            resposta_bruta_ia=getattr(exc, "raw_response", None),
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "A IA retornou sugestões em formato inválido. "
                "Tente gerar novamente ou refine o tema pesquisado."
            ),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except (LLMTimeoutError, EmbeddingTimeoutError) as exc:
        logger.exception("Tempo limite excedido no Ollama durante o RAG")
        await persistir_falha_best_effort(
            texto_base=request.texto,
            parametros=parametros,
        )
        raise HTTPException(
            status_code=504,
            detail=(
                "O processamento com RAG demorou mais que o esperado. "
                "Tente novamente com menos trechos ou menos questões."
            ),
        ) from exc

    except (LLMGenerationError, EmbeddingError) as exc:
        logger.exception("Falha na comunicação com o Ollama durante o RAG")
        await persistir_falha_best_effort(
            texto_base=request.texto,
            parametros=parametros,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "Serviço de sugestões com RAG indisponível. "
                "Verifique se o Ollama e o modelo de embeddings estão ativos ou use o modo manual."
            ),
        ) from exc

    await persistir_geracao_best_effort(
        texto_base=request.texto,
        parametros=parametros,
        conjunto=resultado,
    )
    return resultado