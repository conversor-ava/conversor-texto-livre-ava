from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings


def create_session_factory(
    database_url: str | None,
) -> tuple[AsyncEngine | None, async_sessionmaker[AsyncSession] | None]:
    if not database_url:
        return None, None

    connect_args = (
        {"connect_timeout": 3} if database_url.startswith("mysql") else {}
    )
    db_engine = create_async_engine(
        database_url,
        pool_pre_ping=True,
        connect_args=connect_args,
    )
    session_factory = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    return db_engine, session_factory


engine, AsyncSessionLocal = create_session_factory(settings.database_url)

