from __future__ import annotations

from pydantic import BaseModel, Field, field_validator, model_validator

MIN_ALTERNATIVAS = 2
MAX_ALTERNATIVAS = 8


class AnswerSchema(BaseModel):
    text: str = Field(..., min_length=1, description="Texto da alternativa")
    is_correct: bool = Field(..., description="Indica se esta e a alternativa correta")
    feedback: str | None = Field(
        default=None, description="Feedback exibido ao aluno ao escolher esta alternativa"
    )

    @field_validator("text")
    @classmethod
    def texto_nao_pode_ser_vazio(cls, value: str) -> str:
        valor_tratado = value.strip()
        if not valor_tratado:
            raise ValueError("O texto da alternativa nao pode ser vazio")
        return valor_tratado


class QuestionSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Identificador curto da questao")
    text: str = Field(..., min_length=1, description="Enunciado da questao")
    answers: list[AnswerSchema] = Field(
        ..., min_length=MIN_ALTERNATIVAS, max_length=MAX_ALTERNATIVAS, description="Alternativas da questao"
    )
    general_feedback: str | None = Field(
        default=None, description="Feedback geral exibido apos a resposta do aluno"
    )
    category: str | None = Field(
        default=None, description="Categoria/topico da questao dentro do banco Moodle"
    )

    @field_validator("text")
    @classmethod
    def enunciado_nao_pode_ser_vazio(cls, value: str) -> str:
        valor_tratado = value.strip()
        if not valor_tratado:
            raise ValueError("O enunciado da questao nao pode ser vazio")
        return valor_tratado

    @model_validator(mode="after")
    def deve_ter_exatamente_uma_alternativa_correta(self) -> "QuestionSchema":
        total_corretas = sum(1 for alternativa in self.answers if alternativa.is_correct)
        if total_corretas != 1:
            raise ValueError(
                f"A questao deve ter exatamente 1 alternativa correta, encontradas {total_corretas}"
            )
        return self

    @model_validator(mode="after")
    def alternativas_nao_podem_ser_duplicadas(self) -> "QuestionSchema":
        textos_normalizados = [alternativa.text.strip().lower() for alternativa in self.answers]
        if len(textos_normalizados) != len(set(textos_normalizados)):
            raise ValueError("As alternativas de uma mesma questao nao podem ter textos duplicados")
        return self


class QuestionSetSchema(BaseModel):
    questions: list[QuestionSchema] = Field(
        ..., min_length=1, description="Lista de questoes geradas a partir do texto-base"
    )