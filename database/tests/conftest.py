import os
import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

load_dotenv()

@pytest.fixture(scope="session")
def db_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        pytest.skip("DATABASE_URL environment variable is not set. Please provide it in .env or environment.")
    return url

@pytest.fixture(scope="session")
def db_engine(db_url: str) -> Engine:
    engine = create_engine(db_url)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        pytest.fail(f"Failed to connect to PostgreSQL at {db_url}: {exc}")
    return engine
