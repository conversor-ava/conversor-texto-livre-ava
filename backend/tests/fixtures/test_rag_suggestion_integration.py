import os

import pytest

from app.llm.providers.ollama import OllamaProvider
from app.services.embedding_service import OllamaEmbeddingService
from app.services.rag_service import RAGService
from app.services.rag_suggestion_service import suggest_questions_with_rag


@pytest.mark.asyncio
@pytest.mark.skipif(
    os.getenv("RUN_OLLAMA_TESTS") != "1",
    reason="Teste requer Ollama local.",
)
async def test_rag_gera_questoes_com_ollama_real() -> None:
    embedding_service = OllamaEmbeddingService(
        model="nomic-embed-text",
    )

    rag = RAGService(
        embedding_service=embedding_service,
        chunk_size=500,
        overlap=100,
    )

    provider = OllamaProvider()

    texto = (
        "A fotossíntese é um processo biológico realizado por plantas, "
        "algas e algumas bactérias. Nesse processo, a energia luminosa "
        "é utilizada para produzir compostos orgânicos a partir de "
        "substâncias inorgânicas.\n\n"
        "Nas plantas, a fotossíntese ocorre principalmente nos "
        "cloroplastos, organelas que contêm clorofila. "
        "A clorofila absorve a energia da luz, permitindo que "
        "as reações fotossintéticas aconteçam.\n\n"
        "Durante a fotossíntese, as plantas utilizam água e dióxido "
        "de carbono para produzir glicose e liberar oxigênio. "
        "A glicose produzida pode ser utilizada como fonte de energia "
        "e matéria-prima para o crescimento vegetal.\n\n"
        "A fotossíntese é fundamental para os ecossistemas, pois "
        "contribui para a produção de matéria orgânica e para "
        "a liberação de oxigênio na atmosfera."
    )

    resultado = await suggest_questions_with_rag(
        texto=texto,
        tema="Fotossíntese nas plantas",
        quantidade=1,
        dificuldade="facil",
        alternativas=2,
        rag=rag,
        provider=provider,
        top_k=3,
    )

    assert len(resultado.questions) == 1

    questao = resultado.questions[0]

    assert questao.name.strip()
    assert questao.text.strip()
    assert len(questao.answers) == 2

    alternativas_corretas = [
        alternativa
        for alternativa in questao.answers
        if alternativa.is_correct
    ]

    assert len(alternativas_corretas) == 1

    for alternativa in questao.answers:
        assert alternativa.text.strip()
        assert alternativa.feedback.strip()

    assert len(questao.name) <= 255

    if questao.category is not None:
        assert len(questao.category) <= 255