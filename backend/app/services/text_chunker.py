from dataclasses import dataclass


@dataclass(frozen=True)
class TextChunk:
    index: int
    text: str
    start: int
    end: int


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> list[TextChunk]:
    if not text.strip():
        raise ValueError("O texto não pode estar vazio.")

    if chunk_size <= 0:
        raise ValueError("O tamanho do chunk deve ser maior que zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError(
            "A sobreposição deve ser maior ou igual a zero "
            "e menor que o tamanho do chunk."
        )

    chunks: list[TextChunk] = []
    start = 0
    index = 0

    while start < len(text):
        limit = min(start + chunk_size, len(text))
        end = limit

        if limit < len(text):
            section = text[start:limit]
            break_points = [
                section.rfind("\n\n"),
                section.rfind("\n"),
                section.rfind(". "),
                section.rfind(" "),
            ]

            candidates = [
                position
                for position in break_points
                if position >= chunk_size // 2
            ]

            if candidates:
                end = start + max(candidates) + 1

        content = text[start:end]

        if content.strip():
            chunks.append(
                TextChunk(
                    index=index,
                    text=content,
                    start=start,
                    end=end,
                )
            )
            index += 1

        if end >= len(text):
            break

        start = max(start + 1, end - overlap)

    return chunks