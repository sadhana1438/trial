-- EquiFlow Deterministic Dev Seed Data (v2)
-- Master Specification: Sections 2, 3, 5

DO $$
DECLARE
    v_proj_id UUID;
    v_user_sarah UUID;
    v_user_alex UUID;
    v_skill_python UUID;
    v_skill_react UUID;
    v_skill_ts UUID;
    v_skill_pg UUID;
    v_task_101 UUID;
    v_task_102 UUID;
    v_task_103 UUID;
BEGIN
    -- 1. Create Project
    INSERT INTO projects (name, description, start_date, target_end_date)
    VALUES (
        'EquiFlow Alpha Core',
        'Initial MVP platform development and intelligence engine rollout.',
        NOW() - INTERVAL '14 days',
        NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO v_proj_id;

    -- 2. Create Users
    INSERT INTO users (name, role, github_username, slack_id, daily_capacity)
    VALUES ('Sarah Chen', 'Senior Full-Stack Engineer', 'sarahc', 'U_SARAH_01', 8.0)
    RETURNING id INTO v_user_sarah;

    INSERT INTO users (name, role, github_username, slack_id, daily_capacity)
    VALUES ('Alex Rivera', 'Frontend Engineer', 'alexr', 'U_ALEX_02', 8.0)
    RETURNING id INTO v_user_alex;

    -- 3. Create Skills
    INSERT INTO skills (skill_name) VALUES ('Python') RETURNING skill_id INTO v_skill_python;
    INSERT INTO skills (skill_name) VALUES ('React') RETURNING skill_id INTO v_skill_react;
    INSERT INTO skills (skill_name) VALUES ('TypeScript') RETURNING skill_id INTO v_skill_ts;
    INSERT INTO skills (skill_name) VALUES ('PostgreSQL') RETURNING skill_id INTO v_skill_pg;

    -- 4. User Skills & Proficiency
    INSERT INTO user_skills (user_id, skill_id, proficiency_level, source, last_computed_at)
    VALUES 
        (v_user_sarah, v_skill_python, 3, 'manual', NOW()),
        (v_user_sarah, v_skill_pg, 3, 'manual', NOW()),
        (v_user_sarah, v_skill_react, 2, 'inferred', NOW()),
        (v_user_alex, v_skill_react, 3, 'manual', NOW()),
        (v_user_alex, v_skill_ts, 3, 'manual', NOW()),
        (v_user_alex, v_skill_python, 1, 'inferred', NOW());

    -- 5. Create Tasks
    INSERT INTO tasks (external_id, project_id, title, assigned_to, estimated_hours, hours_remaining, status, due_date, required_skill_id)
    VALUES (
        'EQ-101',
        v_proj_id,
        'Implement Redis Stream Consumer in Intelligence Engine',
        v_user_sarah,
        16.0,
        12.0,
        'IN_PROGRESS',
        NOW() + INTERVAL '3 days',
        v_skill_python
    )
    RETURNING id INTO v_task_101;

    INSERT INTO tasks (external_id, project_id, title, assigned_to, estimated_hours, hours_remaining, status, due_date, required_skill_id)
    VALUES (
        'EQ-102',
        v_proj_id,
        'Build ReactFlow Dependency Graph Component',
        v_user_alex,
        12.0,
        12.0,
        'TODO',
        NOW() + INTERVAL '5 days',
        v_skill_react
    )
    RETURNING id INTO v_task_102;

    INSERT INTO tasks (external_id, project_id, title, assigned_to, estimated_hours, hours_remaining, status, due_date, required_skill_id)
    VALUES (
        'EQ-103',
        v_proj_id,
        'Connect Frontend to WebSocket Alerts Relay',
        v_user_alex,
        8.0,
        8.0,
        'TODO',
        NOW() + INTERVAL '7 days',
        v_skill_react
    )
    RETURNING id INTO v_task_103;

    -- 6. Task Dependencies (Explicit vs Inferred)
    INSERT INTO task_dependencies (blocking_task_id, dependent_task_id, confidence)
    VALUES 
        (v_task_101, v_task_102, 'explicit'),
        (v_task_102, v_task_103, 'inferred');

    -- 7. Work Events (PR Reviews with size buckets, Slack Support, Meetings)
    INSERT INTO work_events (user_id, event_type, event_weight_hours, diff_size_bucket, context_identifier, external_reference, created_at)
    VALUES 
        (v_user_sarah, 'GITHUB_PR_REVIEW', 1.25, 'L', 'repo:org/backend', 'PR #42', NOW() - INTERVAL '2 hours'),
        (v_user_sarah, 'SLACK_SUPPORT', 0.5, NULL, 'slack:eng-support', 'thread:eng-108', NOW() - INTERVAL '1 hour'),
        (v_user_sarah, 'CALENDAR_MEETING', 2.0, NULL, 'gcal:work', 'Sprint Planning', NOW() - INTERVAL '4 hours'),
        (v_user_alex, 'GITHUB_PR_REVIEW', 0.5, 'S', 'repo:org/frontend', 'PR #45', NOW() - INTERVAL '3 hours');

    -- 8. Baseline Workload Scores
    INSERT INTO workload_scores (user_id, w_total, formula_version, computed_at)
    VALUES 
        (v_user_sarah, 0.95, 'v2.0.0', NOW()),
        (v_user_alex, 0.62, 'v2.0.0', NOW());

END $$;
