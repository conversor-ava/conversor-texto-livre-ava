from io import BytesIO

import pytest
from docx import Document

from app.services.text_extractor import (
    TextExtractionError,
    extract_text,
)


def test_extract_txt() -> None:
    content = b"Python e uma linguagem de programacao."

    result = extract_text("material.txt", content)

    assert result == "Python e uma linguagem de programacao."


def test_extract_docx() -> None:
    document = Document()
    document.add_paragraph("Conteudo educacional para o TCC.")

    buffer = BytesIO()
    document.save(buffer)

    result = extract_text("material.docx", buffer.getvalue())

    assert "Conteudo educacional para o TCC." in result


def test_extract_empty_file() -> None:
    with pytest.raises(TextExtractionError):
        extract_text("material.txt", b"")


def test_extract_unsupported_format() -> None:
    with pytest.raises(TextExtractionError):
        extract_text("material.exe", b"conteudo")


def test_extract_invalid_pdf() -> None:
    with pytest.raises(Exception):
        extract_text("material.pdf", b"PDF invalido")