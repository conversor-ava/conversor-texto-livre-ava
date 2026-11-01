from io import BytesIO
from pathlib import Path

from docx import Document
from pypdf import PdfReader


FORMATOS_SUPORTADOS = {".pdf", ".docx", ".txt"}


class TextExtractionError(ValueError):
    pass


def extract_text(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()

    if extension not in FORMATOS_SUPORTADOS:
        raise TextExtractionError("Formato de arquivo não suportado.")

    if not content:
        raise TextExtractionError("O arquivo está vazio.")

    try:
        if extension == ".txt":
            texto = content.decode("utf-8-sig")

        elif extension == ".pdf":
            reader = PdfReader(BytesIO(content))
            texto = "\n".join(
                page.extract_text() or ""
                for page in reader.pages
            )

        else:
            document = Document(BytesIO(content))

            paragrafos = [
                paragraph.text
                for paragraph in document.paragraphs
            ]

            tabelas = [
                cell.text
                for table in document.tables
                for row in table.rows
                for cell in row.cells
            ]

            texto = "\n".join(paragrafos + tabelas)

    except (ValueError, UnicodeError, OSError, KeyError, EOFError) as exc:
        raise TextExtractionError(
            "Não foi possível extrair o texto do documento."
        ) from exc

    texto = texto.strip()

    if not texto:
        raise TextExtractionError(
            "O documento não possui texto extraível."
        )

    return texto