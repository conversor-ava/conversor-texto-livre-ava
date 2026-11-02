from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.text_extractor import (
    FORMATOS_SUPORTADOS,
    TextExtractionError,
    extract_text,
)

router = APIRouter(prefix="/api", tags=["documents"])

MAX_FILE_SIZE = 5 * 1024 * 1024


class ExtractedTextResponse(BaseModel):
    filename: str
    text: str
    characters: int


@router.post("/extract-text", response_model=ExtractedTextResponse)
async def extract_document(
    file: UploadFile = File(...),
) -> ExtractedTextResponse:
    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()

    if extension not in FORMATOS_SUPORTADOS:
        raise HTTPException(
            status_code=415,
            detail="Formato de arquivo não suportado.",
        )

    try:
        content = await file.read(MAX_FILE_SIZE + 1)
    finally:
        await file.close()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="O arquivo excede o limite de 5 MB.",
        )

    try:
        text = extract_text(filename, content)
    except TextExtractionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    return ExtractedTextResponse(
        filename=filename,
        text=text,
        characters=len(text),
    )