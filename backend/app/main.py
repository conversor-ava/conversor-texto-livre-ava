import logging
import os

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

from app.api.document_routes import router as document_router
from app.api.rag_routes import router as rag_router
from app.llm.base import LLMGenerationError, LLMTimeoutError
from app.llm.providers.ollama import OllamaProvider
from app.repositories.geracao import (
    persistir_falha_best_effort,
    persistir_geracao_best_effort,
)
from app.schemas import QuestionSetSchema
from app.services.question_suggestion import suggest_questions
from app.services.text_quiz_parser import parse_free_text_questions
from app.services.xml_converter import convert_to_moodle_xml

logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:4173,http://127.0.0.1:4173"
)
MAX_SIMPLE_IA_CHARS = 15000


def _get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(
    title="Conversor Inteligente Texto Livre para AVA",
    description=(
        "Geracao automatizada de questoes de multipla escolha a partir de "
        "texto-base livre, com entrega em formato Moodle XML."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(document_router)
app.include_router(rag_router)


class SuggestionRequest(BaseModel):
    texto: str = Field(min_length=1)
    quantidade: int = Field(default=5, ge=1, le=20)
    dificuldade: str = "medio"
    alternativas: int = Field(default=4, ge=2, le=8)


class ParseTextRequest(BaseModel):
    texto: str = Field(min_length=1)
    categoria: str | None = None


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/convert", tags=["conversion"])
async def convert_questions(question_set: QuestionSetSchema) -> Response:
    xml = convert_to_moodle_xml(question_set)

    return Response(
        content=xml,
        media_type="application/xml",
        headers={
            "Content-Disposition": 'attachment; filename="questoes_moodle.xml"'
        },
    )


@app.post(
    "/api/parse-text",
    tags=["conversion"],
    response_model=QuestionSetSchema,
)
async def parse_text_route(request: ParseTextRequest) -> QuestionSetSchema:
    try:
        return parse_free_text_questions(
            texto=request.texto,
            categoria_padrao=request.categoria,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@app.post(
    "/api/suggestions",
    tags=["suggestions"],
    response_model=QuestionSetSchema,
)
async def generate_suggestions(
    request: SuggestionRequest,
) -> QuestionSetSchema:
    if len(request.texto) > MAX_SIMPLE_IA_CHARS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"O texto fornecido é muito extenso ({len(request.texto)} caracteres) para o modo IA Simples. "
                "Para materiais longos como livros ou apostilas, utilize o modo RAG ou a conversão direta de questões."
            ),
        )

    parametros = {
        "modo": "simples",
        "quantidade": request.quantidade,
        "dificuldade": request.dificuldade,
        "alternativas": request.alternativas,
    }

    try:
        resultado = await suggest_questions(
            texto=request.texto,
            quantidade=request.quantidade,
            dificuldade=request.dificuldade,
            alternativas=request.alternativas,
            provider=OllamaProvider(),
        )
    except ValidationError as exc:
        logger.warning(
            "Resposta inválida recebida do provider de IA",
            exc_info=True,
        )
        await persistir_falha_best_effort(
            texto_base=request.texto,
            parametros=parametros,
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

    except LLMTimeoutError as exc:
        logger.exception("Tempo limite excedido ao aguardar provider de IA")
        await persistir_falha_best_effort(
            texto_base=request.texto,
            parametros=parametros,
        )
        raise HTTPException(
            status_code=504,
            detail=(
                "A geração das sugestões demorou mais que o esperado. "
                "Tente novamente com um texto menor ou menos questões."
            ),
        ) from exc

    except LLMGenerationError as exc:
        logger.exception("Falha na comunicação com o provider de IA")
        await persistir_falha_best_effort(
            texto_base=request.texto,
            parametros=parametros,
        )
        raise HTTPException(
            status_code=503,
            detail="Serviço de sugestões indisponível.",
        ) from exc

    await persistir_geracao_best_effort(
        texto_base=request.texto,
        parametros=parametros,
        conjunto=resultado,
    )
    return resultado