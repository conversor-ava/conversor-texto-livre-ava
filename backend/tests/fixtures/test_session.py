import asyncio
import os

os.environ["DATABASE_URL"] = "mysql+asyncmy://usuario:senha@localhost:3306/teste"

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  

from app.core.config import Settings  
from app.db.base import Base  
from app.db.models import Geracao, StatusGeracao 
from app.db.session import AsyncSessionLocal, engine 

def test_settings_le_database_url_do_ambiente(monkeypatch):
    url = "mysql+asyncmy://outro:outra@db:3306/outro_banco"
    monkeypatch.setenv("DATABASE_URL", url)

    assert Settings().database_url == url

def test_engine_usa_o_driver_assincrono_do_mysql():
    assert engine.url.drivername == "mysql+asyncmy"
    assert engine.url.database == "teste"

def test_objeto_continua_acessivel_apos_commit_e_dados_sao_gravados():
    async def cenario():
        engine_teste = create_async_engine("sqlite+aiosqlite://")
        try:
            async with engine_teste.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            async with AsyncSessionLocal(bind=engine_teste) as sessao:
                assert isinstance(sessao, AsyncSession)

                geracao = Geracao(texto_base="texto", parametros={"n": 1})
                sessao.add(geracao)
                await sessao.commit()

                assert geracao.id is not None
                assert geracao.status == StatusGeracao.PENDENTE
                geracao_id = geracao.id

            async with AsyncSessionLocal(bind=engine_teste) as outra:
                gravada = await outra.get(Geracao, geracao_id)
                assert gravada is not None
                assert gravada.texto_base == "texto"
        finally:
            await engine_teste.dispose()

    asyncio.run(cenario())






