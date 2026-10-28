import enum
from datetime import datetime

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class StatusGeracao(str, enum.Enum):
    PENDENTE = "pendente"
    CONCLUIDA = "concluida"
    FALHA = "falha"

class Geracao(Base):
    __tablename__ = "geracoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    texto_base: Mapped[str] = mapped_column(Text)
    parametros: Mapped[dict] = mapped_column(JSON)
    data_hora: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    status: Mapped[StatusGeracao] = mapped_column(default=StatusGeracao.PENDENTE)

    questoes: Mapped[list["Questao"]] = relationship(
        back_populates="geracao", 
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class Questao(Base):
    __tablename__ = "questoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(255))
    enunciado: Mapped[str] = mapped_column(Text)
    categoria: Mapped[str | None] = mapped_column(String(255))
    tipo: Mapped[str] = mapped_column(Text)
    geracao_id: Mapped[int] = mapped_column(ForeignKey("geracoes.id", ondelete="CASCADE"))
    geracao: Mapped["Geracao"] = relationship(back_populates="questoes")
    
    alternativas: Mapped[list["Alternativa"]] = relationship(
        back_populates="questao",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class Alternativa(Base):
    __tablename__ = "alternativas"

    id: Mapped[int] = mapped_column(primary_key=True)
    texto: Mapped[str] = mapped_column(Text)
    correta: Mapped[bool]
    justificativa: Mapped[str] = mapped_column(Text)
    questao_id: Mapped[int] = mapped_column(ForeignKey("questoes.id", ondelete="CASCADE"))

    questao: Mapped["Questao"] = relationship(back_populates="alternativas")

