from fastapi import FastAPI

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