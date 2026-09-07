-- EquiFlow PostgreSQL 15 Initial Schema Migration (v2)
-- Master Specification: Section 5

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dependency_confidence') THEN
        CREATE TYPE dependency_confidence AS ENUM ('explicit', 'inferred');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_event_type') THEN
        CREATE TYPE work_event_type AS ENUM ('GITHUB_PR_REVIEW', 'SLACK_SUPPORT', 'GITHUB_COMMENT', 'CALENDAR_MEETING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diff_size_bucket') THEN
        CREATE TYPE diff_size_bucket AS ENUM ('XS', 'S', 'M', 'L', 'XL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_source') THEN
        CREATE TYPE skill_source AS ENUM ('inferred', 'manual');
    END IF;
END $$;

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    target_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    github_username VARCHAR(100) UNIQUE NOT NULL,
    slack_id VARCHAR(100) UNIQUE NOT NULL,
    daily_capacity FLOAT NOT NULL DEFAULT 8.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Skills Table
CREATE TABLE IF NOT EXISTS skills (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(100) UNIQUE NOT NULL
);

-- 4. User Skills (Many-to-Many with Proficiency & Source Tracking)
CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level INT NOT NULL CHECK (proficiency_level BETWEEN 1 AND 3),
    source skill_source NOT NULL DEFAULT 'inferred',
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, skill_id)
);

-- 5. Tasks Table (Ingested from Jira / Linear)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100) NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    estimated_hours FLOAT NOT NULL DEFAULT 4.0,
    hours_remaining FLOAT NOT NULL DEFAULT 4.0,
    status task_status NOT NULL DEFAULT 'TODO',
    due_date TIMESTAMPTZ,
    required_skill_id UUID REFERENCES skills(skill_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tasks_external_project UNIQUE (external_id, project_id)
);

-- 6. Task Dependencies (The Directed Acyclic Graph)
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    confidence dependency_confidence NOT NULL DEFAULT 'explicit',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_dependency CHECK (blocking_task_id != dependent_task_id),
    CONSTRAINT uq_task_dependency_pair UNIQUE (blocking_task_id, dependent_task_id)
);

-- 7. Work Events (Hidden Work Ledger)
CREATE TABLE IF NOT EXISTS work_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type work_event_type NOT NULL,
    event_weight_hours FLOAT NOT NULL,
    diff_size_bucket diff_size_bucket,
    context_identifier VARCHAR(255),
    external_reference VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Workload Scores (Historical Trend & Formula Versioning)
CREATE TABLE IF NOT EXISTS workload_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    w_total FLOAT NOT NULL,
    formula_version VARCHAR(50) NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-Traffic Foreign Key and Query Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_blocking ON task_dependencies(blocking_task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_work_events_user_id ON work_events(user_id);
CREATE INDEX IF NOT EXISTS idx_work_events_created_at ON work_events(created_at);
CREATE INDEX IF NOT EXISTS idx_work_events_user_created ON work_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workload_scores_user_id ON workload_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_workload_scores_computed_at ON workload_scores(computed_at);
