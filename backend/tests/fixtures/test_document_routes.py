from io import BytesIO

from docx import Document
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.document_routes import MAX_FILE_SIZE, router


app = FastAPI()
app.include_router(router)

client = TestClient(app)


def test_extract_txt_success() -> None:
    texto = "Python e uma linguagem de programacao."

    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "material.txt",
                texto.encode("utf-8"),
                "text/plain",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["filename"] == "material.txt"
    assert response.json()["text"] == texto
    assert response.json()["characters"] == len(texto)


def test_extract_docx_success() -> None:
    document = Document()
    document.add_paragraph("Material educacional para o TCC.")

    buffer = BytesIO()
    document.save(buffer)

    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "material.docx",
                buffer.getvalue(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 200
    assert "Material educacional para o TCC." in response.json()["text"]


def test_extract_unsupported_format() -> None:
    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "arquivo.exe",
                b"conteudo",
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 415


def test_extract_empty_file() -> None:
    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "vazio.txt",
                b"",
                "text/plain",
            )
        },
    )

    assert response.status_code == 422


def test_extract_file_too_large() -> None:
    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "grande.txt",
                b"a" * (MAX_FILE_SIZE + 1),
                "text/plain",
            )
        },
    )

    assert response.status_code == 413


def test_extract_accepts_file_up_to_25_mb() -> None:
    assert MAX_FILE_SIZE == 25 * 1024 * 1024

    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "limite.txt",
                b"a" * MAX_FILE_SIZE,
                "text/plain",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["characters"] == MAX_FILE_SIZE


def test_extract_corrupted_pdf_returns_422() -> None:
    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "corrompido.pdf",
                b"PDF invalido",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 422


def test_extract_corrupted_docx_returns_422() -> None:
    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "corrompido.docx",
                b"DOCX invalido",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 422


def test_extract_txt_latin1_success() -> None:
    texto = "Ação, coração e café"

    response = client.post(
        "/api/extract-text",
        files={
            "file": (
                "latin1.txt",
                texto.encode("latin-1"),
                "text/plain",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["text"] == texto