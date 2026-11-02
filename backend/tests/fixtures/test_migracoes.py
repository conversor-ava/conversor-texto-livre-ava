"""Testes das migracoes do Alembic (alembic/versions/).

Rodam em SQLite (arquivo temporario), sem MySQL. Passam pelo env.py de verdade,
entao tambem cobrem a ligacao Alembic <-> Settings <-> Base.metadata.
"""

import logging
import os
from pathlib import Path

# Settings exige DATABASE_URL no momento do import. O valor e ficticio e igual ao
# do test_sessions.py (a ordem dos testes nao importa): cada teste troca a URL
# por um SQLite temporario antes de rodar o Alembic.
os.environ["DATABASE_URL"] = "mysql+asyncmy://usuario:senha@localhost:3306/teste"

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.autogenerate import compare_metadata  # noqa: E402
from alembic.config import Config  # noqa: E402
from alembic.migration import MigrationContext  # noqa: E402
from alembic.script import ScriptDirectory  # noqa: E402
from sqlalchemy import create_engine, inspect  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.db import models  # noqa: E402, F401  (registra as tabelas no Base.metadata)
from app.db.base import Base  # noqa: E402

# sobe as pastas ate achar o alembic.ini (funciona de onde o pytest for chamado)
RAIZ_BACKEND = next(p for p in Path(__file__).resolve().parents if (p / "alembic.ini").exists())

TABELAS_DA_APLICACAO = {"geracoes", "questoes", "alternativas"}


@pytest.fixture()
def banco(tmp_path, monkeypatch):
    """Config do Alembic apontada para um SQLite temporario + arquivo do banco."""
    arquivo = tmp_path / "migracao.db"
    # o env.py le settings.database_url a cada execucao do Alembic
    monkeypatch.setattr(settings, "database_url", f"sqlite+aiosqlite:///{arquivo}")

    cfg = Config(str(RAIZ_BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(RAIZ_BACKEND / "alembic"))

    # o env.py chama logging.config.fileConfig, que desativa os loggers que ja
    # existem. Guardamos o estado para nao afetar os outros testes.
    estado_loggers = {
        nome: logger.disabled
        for nome, logger in logging.root.manager.loggerDict.items()
        if isinstance(logger, logging.Logger)
    }
    yield cfg, arquivo
    for nome, desativado in estado_loggers.items():
        logging.getLogger(nome).disabled = desativado


def _tabelas(arquivo: Path) -> set[str]:
    engine = create_engine(f"sqlite:///{arquivo}")
    try:
        return set(inspect(engine).get_table_names())
    finally:
        engine.dispose()


def test_historico_de_migracoes_tem_um_unico_head(banco):
    """Dois PRs criando migracoes a partir da mesma base geram dois heads.

    O Alembic se recusa a fazer `upgrade head` nesse caso; o teste avisa antes.
    """
    cfg, _ = banco
    heads = ScriptDirectory.from_config(cfg).get_heads()
    assert len(heads) == 1, f"mais de um head no historico: {heads}"


def test_upgrade_cria_as_tabelas_da_aplicacao(banco):
    cfg, arquivo = banco

    command.upgrade(cfg, "head")

    assert TABELAS_DA_APLICACAO <= _tabelas(arquivo)


def test_downgrade_remove_as_tabelas_da_aplicacao(banco):
    cfg, arquivo = banco
    command.upgrade(cfg, "head")

    command.downgrade(cfg, "base")

    # so a tabela de controle do Alembic sobra
    assert _tabelas(arquivo) == {"alembic_version"}


def test_migracoes_estao_em_dia_com_os_models(banco):
    """Falha se alguem mudar um model e esquecer de gerar a migracao."""
    cfg, arquivo = banco
    command.upgrade(cfg, "head")

    engine = create_engine(f"sqlite:///{arquivo}")
    try:
        with engine.connect() as conexao:
            diferencas = compare_metadata(MigrationContext.configure(conexao), Base.metadata)
    finally:
        engine.dispose()

    assert diferencas == [], (
        "Os models divergem das migracoes. Gere uma nova migracao "
        f"(alembic revision --autogenerate). Diferencas: {diferencas}"
    )