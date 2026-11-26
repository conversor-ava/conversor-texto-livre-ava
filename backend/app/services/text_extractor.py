from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from pypdf import PdfReader
from pypdf.errors import PyPdfError

FORMATOS_SUPORTADOS = {".pdf", ".docx", ".txt"}
ENCODINGS_TXT = ("utf-8-sig", "utf-8", "cp1252", "latin-1")


class TextExtractionError(ValueError):
    pass


def _decode_txt(content: bytes) -> str:
    for encoding in ENCODINGS_TXT:
        try:
            texto = content.decode(encoding)
        except UnicodeDecodeError:
            continue

        if "\x00" in texto:
            raise TextExtractionError(
                "Não foi possível extrair o texto do documento."
            )

        return texto

    raise TextExtractionError("Não foi possível extrair o texto do documento.")


def extract_text(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()

    if extension not in FORMATOS_SUPORTADOS:
        raise TextExtractionError("Formato de arquivo não suportado.")

    if not content:
        raise TextExtractionError("O arquivo está vazio.")

    try:
        if extension == ".txt":
            texto = _decode_txt(content)

        elif extension == ".pdf":
            reader = PdfReader(BytesIO(content))
            if reader.is_encrypted:
                reader.decrypt("")
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

    except TextExtractionError:
        raise
    except (
        ValueError,
        UnicodeError,
        OSError,
        KeyError,
        EOFError,
        PyPdfError,
        BadZipFile,
        PackageNotFoundError,
    ) as exc:
        raise TextExtractionError(
            "Não foi possível extrair o texto do documento."
        ) from exc

    texto = texto.strip()

    if not texto:
        if extension == ".pdf":
            raise TextExtractionError(
                "O PDF não possui texto selecionável. Verifique se o arquivo não está digitalizado apenas como imagem."
            )
        raise TextExtractionError(
            "O documento não possui texto extraível."
        )

    return texto