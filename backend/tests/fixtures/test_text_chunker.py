import pytest

from app.services.text_chunker import chunk_text


def test_chunk_text_short_document() -> None:
    text = "Python é uma linguagem de programação."

    chunks = chunk_text(text)

    assert len(chunks) == 1
    assert chunks[0].text == text
    assert chunks[0].start == 0
    assert chunks[0].end == len(text)


def test_chunk_text_long_document() -> None:
    text = "A" * 2500

    chunks = chunk_text(
        text,
        chunk_size=1000,
        overlap=200,
    )

    assert len(chunks) == 3
    assert all(len(chunk.text) <= 1000 for chunk in chunks)


def test_chunk_text_overlap() -> None:
    text = "A" * 1000 + "B" * 1000

    chunks = chunk_text(
        text,
        chunk_size=1000,
        overlap=200,
    )

    assert chunks[0].end == 1000
    assert chunks[1].start == 800
    assert chunks[0].text[-200:] == chunks[1].text[:200]


def test_chunk_text_preserves_content() -> None:
    text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" * 100

    chunks = chunk_text(
        text,
        chunk_size=500,
        overlap=100,
    )

    assert chunks[0].start == 0
    assert chunks[-1].end == len(text)

    for chunk in chunks:
        assert chunk.text == text[chunk.start:chunk.end]

    for current, following in zip(chunks, chunks[1:]):
        assert following.start <= current.end


def test_chunk_text_preserves_paragraph_boundaries() -> None:
    text = (
        "Primeiro parágrafo com informações importantes.\n\n"
        "Segundo parágrafo com outros conceitos importantes.\n\n"
        "Terceiro parágrafo para completar o documento."
    )

    chunks = chunk_text(
        text,
        chunk_size=100,
        overlap=20,
    )

    assert len(chunks) >= 2
    assert all(chunk.text.strip() for chunk in chunks)


def test_chunk_text_rejects_empty_text() -> None:
    with pytest.raises(ValueError):
        chunk_text("   ")


def test_chunk_text_rejects_invalid_size() -> None:
    with pytest.raises(ValueError):
        chunk_text("Texto válido", chunk_size=0)


def test_chunk_text_rejects_invalid_overlap() -> None:
    with pytest.raises(ValueError):
        chunk_text(
            "Texto válido",
            chunk_size=100,
            overlap=100,
        )


def test_chunk_text_rejects_negative_overlap() -> None:
    with pytest.raises(ValueError):
        chunk_text(
            "Texto válido",
            chunk_size=100,
            overlap=-1,
        )