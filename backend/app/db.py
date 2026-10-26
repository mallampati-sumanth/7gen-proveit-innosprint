from sqlmodel import SQLModel, create_engine, Session
from backend.app.config import settings

# Configure engine dynamically for SQLite or Supabase (PostgreSQL)
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True
)


def init_db() -> None:
    """Initialize database tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency for obtaining database sessions."""
    with Session(engine) as session:
        yield session
