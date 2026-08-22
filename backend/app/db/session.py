from collections.abc import Generator

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine.interfaces import DBAPIConnection
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import ConnectionPoolEntry

from app.core.config import settings


def _enable_sqlite_foreign_keys(
    dbapi_connection: DBAPIConnection, connection_record: ConnectionPoolEntry
) -> None:
    del connection_record
    # SQLite ignores declared foreign keys unless each connection opts in.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def create_db_engine(database_url: str) -> Engine:
    is_sqlite = make_url(database_url).get_backend_name() == "sqlite"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False} if is_sqlite else {},
    )
    if is_sqlite:
        event.listen(engine, "connect", _enable_sqlite_foreign_keys)
    return engine


engine = create_db_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
