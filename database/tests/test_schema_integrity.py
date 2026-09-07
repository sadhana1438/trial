import pytest
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DBAPIError, IntegrityError

EXPECTED_TABLES = [
    "projects",
    "users",
    "skills",
    "user_skills",
    "tasks",
    "task_dependencies",
    "work_events",
    "workload_scores",
]

EXPECTED_ENUMS = {
    "task_status": ["TODO", "IN_PROGRESS", "DONE"],
    "dependency_confidence": ["explicit", "inferred"],
    "work_event_type": ["GITHUB_PR_REVIEW", "SLACK_SUPPORT", "GITHUB_COMMENT", "CALENDAR_MEETING"],
    "diff_size_bucket": ["XS", "S", "M", "L", "XL"],
    "skill_source": ["inferred", "manual"],
}

EXPECTED_INDEXES = [
    "idx_tasks_assigned_to",
    "idx_tasks_project_id",
    "idx_task_deps_blocking",
    "idx_task_deps_dependent",
    "idx_work_events_user_id",
    "idx_work_events_created_at",
    "idx_workload_scores_user_id",
    "idx_workload_scores_computed_at",
]


def test_all_expected_tables_exist(db_engine: Engine):
    """Verify that all 8 core EquiFlow tables exist in the public schema."""
    with db_engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
                """
            )
        )
        existing_tables = {row[0] for row in result.fetchall()}

    for table in EXPECTED_TABLES:
        assert table in existing_tables, f"Table '{table}' is missing from database schema."


def test_custom_enums_and_values_exist(db_engine: Engine):
    """Verify that all required custom PostgreSQL enum types and their values exist."""
    with db_engine.connect() as conn:
        for enum_name, expected_values in EXPECTED_ENUMS.items():
            result = conn.execute(
                text(
                    """
                    SELECT e.enumlabel
                    FROM pg_type t
                    JOIN pg_enum e ON t.oid = e.enumtypid
                    JOIN pg_namespace n ON n.oid = t.typnamespace
                    WHERE t.typname = :enum_name AND n.nspname = 'public';
                    """
                ),
                {"enum_name": enum_name},
            )
            actual_values = [row[0] for row in result.fetchall()]
            assert actual_values, f"Enum '{enum_name}' does not exist."
            for val in expected_values:
                assert val in actual_values, f"Value '{val}' missing in enum '{enum_name}'."


def test_required_indexes_exist(db_engine: Engine):
    """Verify high-traffic foreign key and timestamp indexes are defined."""
    with db_engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT indexname
                FROM pg_indexes
                WHERE schemaname = 'public';
                """
            )
        )
        existing_indexes = {row[0] for row in result.fetchall()}

    for idx in EXPECTED_INDEXES:
        assert idx in existing_indexes, f"Index '{idx}' is missing from PostgreSQL schema."


def test_tasks_unique_constraint_on_external_and_project_id(db_engine: Engine):
    """Verify that tasks table enforces UNIQUE (external_id, project_id)."""
    with db_engine.connect() as conn:
        trans = conn.begin()
        try:
            # Create a test project
            proj_res = conn.execute(
                text(
                    "INSERT INTO projects (name, description) VALUES ('Test Uniq Proj', 'Desc') RETURNING id;"
                )
            )
            proj_id = proj_res.scalar()

            # Insert first task
            conn.execute(
                text(
                    """
                    INSERT INTO tasks (external_id, project_id, title, estimated_hours, hours_remaining, status)
                    VALUES ('EXT-001', :p_id, 'Task 1', 5.0, 5.0, 'TODO');
                    """
                ),
                {"p_id": proj_id},
            )

            # Insert duplicate task with same (external_id, project_id) -> must fail
            with pytest.raises(DBAPIError):
                conn.execute(
                    text(
                        """
                        INSERT INTO tasks (external_id, project_id, title, estimated_hours, hours_remaining, status)
                        VALUES ('EXT-001', :p_id, 'Task 1 Duplicate', 3.0, 3.0, 'TODO');
                        """
                    ),
                    {"p_id": proj_id},
                )
        finally:
            trans.rollback()


def test_user_skills_proficiency_range_constraint(db_engine: Engine):
    """Verify that user_skills restricts proficiency_level to between 1 and 3."""
    with db_engine.connect() as conn:
        trans = conn.begin()
        try:
            user_id = conn.execute(
                text("INSERT INTO users (name, role, github_username, slack_id) VALUES ('Alice', 'Dev', 'alice_uniq', 'U_ALICE') RETURNING id;")
            ).scalar()

            skill_id = conn.execute(
                text("INSERT INTO skills (skill_name) VALUES ('TestSkillUnique') RETURNING skill_id;")
            ).scalar()

            # Insert invalid proficiency level (e.g. 5) -> must fail
            with pytest.raises(DBAPIError):
                conn.execute(
                    text(
                        """
                        INSERT INTO user_skills (user_id, skill_id, proficiency_level, source)
                        VALUES (:u_id, :s_id, 5, 'inferred');
                        """
                    ),
                    {"u_id": user_id, "s_id": skill_id},
                )
        finally:
            trans.rollback()


def test_task_dependencies_constraints(db_engine: Engine):
    """Verify that task dependencies disallow self-referencing tasks."""
    with db_engine.connect() as conn:
        trans = conn.begin()
        try:
            proj_id = conn.execute(
                text("INSERT INTO projects (name) VALUES ('Proj Self Dep') RETURNING id;")
            ).scalar()

            task_id = conn.execute(
                text(
                    """
                    INSERT INTO tasks (external_id, project_id, title)
                    VALUES ('SELF-01', :p_id, 'Self Task') RETURNING id;
                    """
                ),
                {"p_id": proj_id},
            ).scalar()

            # Attempt self-dependency: blocking_task_id == dependent_task_id -> must fail
            with pytest.raises(DBAPIError):
                conn.execute(
                    text(
                        """
                        INSERT INTO task_dependencies (blocking_task_id, dependent_task_id, confidence)
                        VALUES (:t_id, :t_id, 'explicit');
                        """
                    ),
                    {"t_id": task_id},
                )
        finally:
            trans.rollback()


def test_seed_data_loaded_and_verified(db_engine: Engine):
    """Verify that development seed data contains expected users, tasks, and dependency graph."""
    with db_engine.connect() as conn:
        # Check users
        users = conn.execute(text("SELECT github_username, role FROM users WHERE github_username IN ('sarahc', 'alexr');")).fetchall()
        assert len(users) == 2, f"Expected 2 seed users, found {len(users)}"

        # Check tasks
        tasks = conn.execute(text("SELECT external_id, status FROM tasks WHERE external_id IN ('EQ-101', 'EQ-102', 'EQ-103');")).fetchall()
        assert len(tasks) == 3, f"Expected 3 seed tasks, found {len(tasks)}"

        # Check dependency confidence types
        deps = conn.execute(
            text(
                """
                SELECT td.confidence
                FROM task_dependencies td
                JOIN tasks b ON td.blocking_task_id = b.id
                JOIN tasks d ON td.dependent_task_id = d.id
                WHERE b.external_id = 'EQ-101' AND d.external_id = 'EQ-102';
                """
            )
        ).scalar()
        assert deps == "explicit", f"Expected explicit dependency between EQ-101 and EQ-102, got {deps}"

        inferred_dep = conn.execute(
            text(
                """
                SELECT td.confidence
                FROM task_dependencies td
                JOIN tasks b ON td.blocking_task_id = b.id
                JOIN tasks d ON td.dependent_task_id = d.id
                WHERE b.external_id = 'EQ-102' AND d.external_id = 'EQ-103';
                """
            )
        ).scalar()
        assert inferred_dep == "inferred", f"Expected inferred dependency between EQ-102 and EQ-103, got {inferred_dep}"

