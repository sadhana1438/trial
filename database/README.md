# EquiFlow Database (PostgreSQL 15)

This module contains the PostgreSQL 15 schema DDL, deterministic development fixtures, migration runner, and automated schema integrity tests for EquiFlow.

## Architecture & Schema (v2)

The database models both traditional task management and passive activity metadata:
- `projects`: Project scoping for macroscopic dashboards
- `users`: Engineering team members with capacity and external IDs (GitHub, Slack)
- `skills` & `user_skills`: Skill tracking with 1–3 proficiency levels and source (`inferred` vs `manual`)
- `tasks`: Ingested tasks with `hours_remaining`, `project_id`, `required_skill_id`, and unique `(external_id, project_id)`
- `task_dependencies`: The DAG with `confidence` flag (`explicit` vs `inferred`)
- `work_events`: Hidden work ledger with PR diff size buckets (`XS`, `S`, `M`, `L`, `XL`), event types, and context identifiers
- `workload_scores`: Historical workload computation results with `formula_version`

## Setup & Execution

### 1. Environment Configuration
Copy `.env.example` to `.env` in the project root:
```bash
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require
```

### 2. Apply Migrations & Seeds
```bash
# Run migrations
.\.venv\Scripts\python.exe database/scripts/migrate.py

# Run migrations and apply seed fixtures
.\.venv\Scripts\python.exe database/scripts/migrate.py --seed
```

### 3. Run Test Scaffolding
```bash
.\.venv\Scripts\pytest.exe database/tests/test_schema_integrity.py -v
```
