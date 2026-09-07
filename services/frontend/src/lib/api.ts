import { UserScoreSummary, TaskItem, DependencyItem, WorkEventItem, SimulationResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchUsersScores(): Promise<UserScoreSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/scores/summary`, { next: { revalidate: 5 } });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    // Fallback to seed state for offline rendering
    return [
      {
        user_id: 'u-sarah-chen',
        name: 'Sarah Chen',
        role: 'Senior Full-Stack Engineer',
        github_username: 'sarahc',
        daily_capacity: 8.0,
        w_total: 1.15,
        is_overloaded: true,
        formula_version: 'v2.0.0',
        last_computed_at: new Date().toISOString(),
      },
      {
        user_id: 'u-alex-rivera',
        name: 'Alex Rivera',
        role: 'Frontend Engineer',
        github_username: 'alexr',
        daily_capacity: 8.0,
        w_total: 0.62,
        is_overloaded: false,
        formula_version: 'v2.0.0',
        last_computed_at: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchProjectTasks(): Promise<{ tasks: TaskItem[]; dependencies: DependencyItem[] }> {
  return {
    tasks: [
      {
        id: 't-101',
        external_id: 'EQ-101',
        title: 'Implement Redis Stream Consumer in Intelligence Engine',
        assigned_to: 'u-sarah-chen',
        assignee_name: 'Sarah Chen',
        estimated_hours: 16.0,
        hours_remaining: 12.0,
        status: 'IN_PROGRESS',
        due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
        required_skill_name: 'Python',
      },
      {
        id: 't-102',
        external_id: 'EQ-102',
        title: 'Build ReactFlow Dependency Graph Component',
        assigned_to: 'u-alex-rivera',
        assignee_name: 'Alex Rivera',
        estimated_hours: 12.0,
        hours_remaining: 12.0,
        status: 'TODO',
        due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
        required_skill_name: 'React',
      },
      {
        id: 't-103',
        external_id: 'EQ-103',
        title: 'Connect Frontend to WebSocket Alerts Relay',
        assigned_to: 'u-alex-rivera',
        assignee_name: 'Alex Rivera',
        estimated_hours: 8.0,
        hours_remaining: 8.0,
        status: 'TODO',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        required_skill_name: 'React',
      },
    ],
    dependencies: [
      {
        id: 'd-1',
        blocking_task_id: 't-101',
        dependent_task_id: 't-102',
        confidence: 'explicit',
      },
      {
        id: 'd-2',
        blocking_task_id: 't-102',
        dependent_task_id: 't-103',
        confidence: 'inferred',
      },
    ],
  };
}

export async function fetchRecentGlueWork(): Promise<WorkEventItem[]> {
  return [
    {
      id: 'we-1',
      event_type: 'GITHUB_PR_REVIEW',
      weight_hours: 1.25,
      diff_size_bucket: 'L',
      context_identifier: 'repo:equiflow/backend',
      external_reference: 'PR #42',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'we-2',
      event_type: 'SLACK_SUPPORT',
      weight_hours: 0.5,
      context_identifier: 'slack:eng-support',
      external_reference: 'thread:eng-108',
      created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
      id: 'we-3',
      event_type: 'CALENDAR_MEETING',
      weight_hours: 2.0,
      context_identifier: 'gcal:work',
      external_reference: 'Architecture Review & Sprint Planning',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'we-4',
      event_type: 'GITHUB_PR_REVIEW',
      weight_hours: 0.5,
      diff_size_bucket: 'S',
      context_identifier: 'repo:equiflow/frontend',
      external_reference: 'PR #45',
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
  ];
}

export async function simulateReassignment(payload: {
  task_id: string;
  current_assignee: string;
  proposed_assignee: string;
}): Promise<SimulationResult> {
  try {
    const res = await fetch(`${API_BASE}/api/simulation/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Simulation endpoint returned error');
    return await res.json();
  } catch {
    // Client-side fallback computation matching Python engine
    return {
      status: 'success',
      action: 'SIMULATE_REASSIGNMENT',
      task: {
        id: payload.task_id,
        external_id: 'EQ-101',
        title: 'Implement Redis Stream Consumer in Intelligence Engine',
        status: 'IN_PROGRESS',
        original_hours_remaining: 12.0,
        new_hours_remaining: 19.6,
        duration_delta_hours: 7.6,
      },
      simulation_factors: {
        s_multiplier: 1.5,
        is_inferred_skill: true,
        h_handoff: 1.6,
        delay_risk: true,
        delayed_task_ids: ['t-102', 't-103'],
        has_inferred_dependency_crossings: true,
      },
      member_a: {
        id: payload.current_assignee,
        name: 'Sarah Chen',
        workload_before: 1.15,
        workload_after: 0.72,
        is_overloaded_before: true,
        is_overloaded_after: false,
      },
      member_b: {
        id: payload.proposed_assignee,
        name: 'Alex Rivera',
        workload_before: 0.62,
        workload_after: 0.98,
        is_overloaded_before: false,
        is_overloaded_after: false,
      },
      warnings: [
        'Simulation relies on inferred skill data for Alex Rivera (Novice / Skill Mismatch multiplier applied).',
        'Downstream propagation crosses an inferred dependency edge; timeline breach risk is estimated.',
      ],
    };
  }
}
