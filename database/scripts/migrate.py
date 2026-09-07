#!/usr/bin/env python3
"""
EquiFlow Database Migration Runner
Executes SQL migrations and seeds in order against the configured PostgreSQL database.
"""

import argparse
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2

BASE_DIR = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = BASE_DIR / "migrations"
SEEDS_DIR = BASE_DIR / "seeds"

load_dotenv(BASE_DIR.parent / ".env")


def get_db_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("[ERROR] DATABASE_URL is not set. Please define it in .env or your environment.", file=sys.stderr)
        sys.exit(1)
    return url


def run_sql_file(conn, file_path: Path):
    print(f"[MIGRATE] Executing: {file_path.name}...")
    with open(file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    with conn.cursor() as cur:
        cur.execute(sql_content)
    conn.commit()
    print(f"[SUCCESS] Applied {file_path.name}")


def main():
    parser = argparse.ArgumentParser(description="EquiFlow Database Migration Runner")
    parser.add_argument("--seed", action="store_true", help="Apply development seed data after migrations")
    args = parser.parse_args()

    db_url = get_db_url()
    print(f"[INIT] Connecting to PostgreSQL...")

    try:
        conn = psycopg2.connect(db_url)
    except Exception as exc:
        print(f"[ERROR] Could not connect to PostgreSQL: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        # Run migrations in lexicographical order
        migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
        if not migration_files:
            print(f"[WARN] No migration files found in {MIGRATIONS_DIR}")
        for mig_file in migration_files:
            run_sql_file(conn, mig_file)

        # Run seeds if requested
        if args.seed:
            seed_files = sorted(SEEDS_DIR.glob("*.sql"))
            for seed_file in seed_files:
                run_sql_file(conn, seed_file)

        print("[COMPLETE] All database operations completed successfully.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
