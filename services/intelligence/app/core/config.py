import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent.parent

# Load root .env
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/equiflow")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
FORMULA_VERSION = os.getenv("FORMULA_VERSION", "v2.0.0")
PORT = int(os.getenv("INTELLIGENCE_PORT", "8000"))
STREAM_KEY = "equiflow:events:stream"
CONSUMER_GROUP = "equiflow:intelligence:workers"
ALERTS_CHANNEL = "equiflow:alerts"
