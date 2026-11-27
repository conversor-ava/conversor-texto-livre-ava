from __future__ import annotations

from pydantic import (
    BaseModel,
    Field,
    ValidationInfo,
    field_validator,
    model_validator,
)

MIN_ALTERNATIVAS = 2
MAX_ALTERNATIVAS = 8
MAX_QUESTOES_LOTE = 100


class AnswerSchema(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Texto da alternativa",
    )

    is_correct: bool = Field(
        ...,
        strict=True,
        description="Indica se a alternativa está correta",
    )

    feedback: str = Field(
        ...,
        min_length=1,
        description="Justificativa da alternativa",
    )

    @field_validator("text", "feedback")
    @classmethod
    def validar_texto(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("A alternativa não pode estar vazia")

        return value


class QuestionSchema(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    text: str = Field(
        ...,
        min_length=1,
    )

    answers: list[AnswerSchema] = Field(
        ...,
        min_length=MIN_ALTERNATIVAS,
        max_length=MAX_ALTERNATIVAS,
    )

    general_feedback: str | None = None

    category: str | None = Field(default=None, max_length=255)

    @field_validator("name", "text")
    @classmethod
    def validar_campos_obrigatorios(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("O campo não pode estar vazio")

        return value

    @field_validator("category")
    @classmethod
    def limpar_categoria(cls, value: str | None) -> str | None:
        if value is None:
            return None
        limpa = value.strip()
        return limpa or None

    @model_validator(mode="after")
    def validar_alternativas(self) -> QuestionSchema:
        corretas = sum(
            alternativa.is_correct
            for alternativa in self.answers
        )

        if corretas != 1:
            raise ValueError(
                "Cada questão deve possuir exatamente uma alternativa correta"
            )

        textos = [
            alternativa.text.casefold()
            for alternativa in self.answers
        ]

        if len(textos) != len(set(textos)):
            raise ValueError(
                "A questão contém alternativas duplicadas"
            )

        return self


class QuestionSetSchema(BaseModel):
    questions: list[QuestionSchema] = Field(
        ...,
        min_length=1,
        max_length=MAX_QUESTOES_LOTE,
    )

    @model_validator(mode="after")
    def validar_parametros(self, info: ValidationInfo) -> QuestionSetSchema:
        contexto = info.context or {}

        quantidade_questoes = contexto.get("quantidade_questoes")
        quantidade_alternativas = contexto.get("quantidade_alternativas")

        if quantidade_questoes is not None:
            if len(self.questions) != quantidade_questoes:
                raise ValueError(
                    f"Esperadas {quantidade_questoes} questões, "
                    f"recebidas {len(self.questions)}"
                )

        if quantidade_alternativas is not None:
            if not MIN_ALTERNATIVAS <= quantidade_alternativas <= MAX_ALTERNATIVAS:
                raise ValueError(
                    "A quantidade de alternativas solicitada é inválida"
                )

            for indice, questao in enumerate(self.questions, start=1):
                if len(questao.answers) != quantidade_alternativas:
                    raise ValueError(
                        f"Questão {indice}: esperadas "
                        f"{quantidade_alternativas} alternativas, "
                        f"recebidas {len(questao.answers)}"
                    )

        return self


class DraftAnswerSchema(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Texto da alternativa",
    )

    is_correct: bool = Field(
        ...,
        strict=True,
        description="Indica se a alternativa está correta",
    )

    feedback: str = Field(
        default="",
        description="Justificativa da alternativa (opcional no rascunho)",
    )

    @field_validator("text")
    @classmethod
    def validar_texto_alternativa(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("A alternativa não pode estar vazia")
        return value

    @field_validator("feedback")
    @classmethod
    def limpar_feedback(cls, value: str) -> str:
        return value.strip()


class DraftQuestionSchema(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    text: str = Field(
        ...,
        min_length=1,
    )

    answers: list[DraftAnswerSchema] = Field(
        ...,
        min_length=MIN_ALTERNATIVAS,
        max_length=MAX_ALTERNATIVAS,
    )

    general_feedback: str | None = None

    category: str | None = Field(default=None, max_length=255)

    @field_validator("name", "text")
    @classmethod
    def validar_campos_obrigatorios(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O campo não pode estar vazio")
        return value

    @field_validator("category")
    @classmethod
    def limpar_categoria(cls, value: str | None) -> str | None:
        if value is None:
            return None
        limpa = value.strip()
        return limpa or None

    @model_validator(mode="after")
    def validar_alternativas(self) -> DraftQuestionSchema:
        corretas = sum(
            alternativa.is_correct
            for alternativa in self.answers
        )

        if corretas != 1:
            raise ValueError(
                "Cada questão deve possuir exatamente uma alternativa correta"
            )

        textos = [
            alternativa.text.casefold()
            for alternativa in self.answers
        ]

        if len(textos) != len(set(textos)):
            raise ValueError(
                "A questão contém alternativas duplicadas"
            )

        return self


class DraftQuestionSetSchema(BaseModel):
    questions: list[DraftQuestionSchema] = Field(
        ...,
        min_length=1,
        max_length=MAX_QUESTOES_LOTE,
    )