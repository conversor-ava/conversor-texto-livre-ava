from fastapi import FastAPI, Response

from app.schemas import QuestionSetSchema
from app.services.xml_converter import convert_to_moodle_xml


app = FastAPI(
    title="Conversor Inteligente Texto Livre para AVA",
    description=(
        "Geracao automatizada de questoes de multipla escolha a partir de "
        "texto-base livre, com entrega em formato Moodle XML."
    ),
    version="0.1.0",
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/convert", tags=["conversion"])
async def convert_questions(question_set: QuestionSetSchema) -> Response:
    xml = convert_to_moodle_xml(question_set)

    return Response(
        content=xml,
        media_type="application/xml",
        headers={
            "Content-Disposition": 'attachment; filename="questoes_moodle.xml"'
        },
    )