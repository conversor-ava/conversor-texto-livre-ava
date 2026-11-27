from app.services.embedding_service import OllamaEmbeddingService
from app.services.text_chunker import TextChunk, chunk_text
from app.services.vector_store import InMemoryVectorStore, SearchResult

DEFAULT_MIN_SIMILARITY = 0.45


class RAGService:
    def __init__(
        self,
        embedding_service: OllamaEmbeddingService,
        chunk_size: int = 1000,
        overlap: int = 200,
        min_similarity: float | None = DEFAULT_MIN_SIMILARITY,
    ) -> None:
        self.embedding_service = embedding_service
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.min_similarity = min_similarity
        self.store = InMemoryVectorStore()
        self.chunks: list[TextChunk] = []

    async def index_document(self, text: str) -> int:
        chunks = chunk_text(
            text,
            chunk_size=self.chunk_size,
            overlap=self.overlap,
        )

        if not chunks:
            raise ValueError("Não foi possível segmentar o documento.")

        embeddings = await self.embedding_service.embed(
            [chunk.text for chunk in chunks]
        )

        store = InMemoryVectorStore()
        store.add(chunks, embeddings)

        self.store = store
        self.chunks = chunks

        return len(chunks)

    async def retrieve(
        self,
        query: str,
        top_k: int = 3,
        min_similarity: float | None = None,
    ) -> list[SearchResult]:
        if not query.strip():
            raise ValueError("A consulta não pode estar vazia.")

        if top_k <= 0:
            raise ValueError("top_k deve ser maior que zero.")

        if not self.chunks:
            raise ValueError("Nenhum documento foi indexado.")

        threshold = (
            min_similarity if min_similarity is not None else self.min_similarity
        )
        query_embedding = await self.embedding_service.embed([query])

        return self.store.search(
            query_embedding[0],
            top_k=top_k,
            min_similarity=threshold,
        )

    async def retrieve_context(
        self,
        query: str,
        top_k: int = 3,
        min_similarity: float | None = None,
    ) -> str:
        results = await self.retrieve(
            query,
            top_k=top_k,
            min_similarity=min_similarity,
        )

        if not results:
            raise ValueError(
                f"Nenhum trecho relevante foi encontrado no texto-base para o tema '{query}'. "
                "Tente informar um tema mais próximo do conteúdo do documento."
            )

        return "\n\n".join(
            result.chunk.text
            for result in results
        )