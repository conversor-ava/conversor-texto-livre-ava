import os

import pytest

from app.services.embedding_service import OllamaEmbeddingService
from app.services.rag_service import RAGService


@pytest.mark.asyncio
@pytest.mark.skipif(
    os.getenv("RUN_OLLAMA_TESTS") != "1",
    reason="Teste de integração requer Ollama local.",
)
async def test_rag_com_ollama_real() -> None:
    service = OllamaEmbeddingService()

    rag = RAGService(
        embedding_service=service,
        chunk_size=120,
        overlap=20,
    )

    texto = (
        "Python é uma linguagem de programação utilizada "
        "no desenvolvimento de aplicações.\n\n"
        "MySQL é um sistema de gerenciamento de bancos "
        "de dados relacionais.\n\n"
        "Git é uma ferramenta de controle de versão "
        "utilizada no desenvolvimento de software."
    )

    total = await rag.index_document(texto)

    resultados = await rag.retrieve(
        "Qual tecnologia é utilizada para armazenar dados relacionais?",
        top_k=2,
    )

    assert total >= 2
    assert len(resultados) == 2
    assert all(resultado.chunk.text for resultado in resultados)
    assert all(-1 <= resultado.score <= 1 for resultado in resultados)