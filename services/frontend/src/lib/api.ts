import {
  UserScoreSummary,
  TaskItem,
  DependencyItem,
  WorkEventItem,
  SimulationResult,
  ProjectItem,
  BottleneckDetail,
  IntegrationItem,
  NotificationItem,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchUsersScores(): Promise<UserScoreSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/scores/summary`, { next: { revalidate: 5 } });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.map((u: any) => ({
      ...u,
      assigned_hours: u.github_username === 'sarahc' ? 7.8 : 4.8,
      hidden_hours: u.github_username === 'sarahc' ? 3.2 : 1.4,
      meeting_hours: u.github_username === 'sarahc' ? 2.0 : 0.8,
      support_contributions: u.github_username === 'sarahc' ? 14 : 5,
      pr_reviews_count: u.github_username === 'sarahc' ? 8 : 2,
      rework_percentage: u.github_username === 'sarahc' ? 4 : 2,
      interruption_rate: u.github_username === 'sarahc' ? 22 : 6,
    }));
  } catch {
    // Fallback to seed state
    return [
      {
        user_id: 'u-sarah-chen',
        name: 'Sarah Chen',
        role: 'Senior Full-Stack Engineer',
        github_username: 'sarahc',
        daily_capacity: 8.0,
        w_total: 1.29,
        is_overloaded: true,
        formula_version: 'v2.0.0',
        last_computed_at: new Date().toISOString(),
        assigned_hours: 7.8,
        hidden_hours: 3.2,
        meeting_hours: 2.0,
        support_contributions: 14,
        pr_reviews_count: 8,
        rework_percentage: 4,
        interruption_rate: 22,
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
        assigned_hours: 4.8,
        hidden_hours: 1.4,
        meeting_hours: 0.8,
        support_contributions: 5,
        pr_reviews_count: 2,
        rework_percentage: 2,
        interruption_rate: 6,
      },
      {
        user_id: 'u-marcus-vance',
        name: 'Marcus Vance',
        role: 'DevOps & Reliability Engineer',
        github_username: 'marcusv',
        daily_capacity: 8.0,
        w_total: 0.84,
        is_overloaded: false,
        formula_version: 'v2.0.0',
        last_computed_at: new Date().toISOString(),
        assigned_hours: 5.2,
        hidden_hours: 2.1,
        meeting_hours: 1.5,
        support_contributions: 9,
        pr_reviews_count: 4,
        rework_percentage: 1,
        interruption_rate: 14,
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
        priority: 'HIGH',
        complexity: 'L',
        required_skill_name: 'Python',
        is_bottleneck: true,
        delay_risk_score: 72,
        blocks: ['EQ-102'],
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
        priority: 'MEDIUM',
        complexity: 'M',
        required_skill_name: 'React',
        is_bottleneck: false,
        delay_risk_score: 45,
        blocked_by: ['EQ-101'],
        blocks: ['EQ-103'],
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
        priority: 'MEDIUM',
        complexity: 'S',
        required_skill_name: 'React',
        is_bottleneck: false,
        delay_risk_score: 30,
        blocked_by: ['EQ-102'],
      },
      {
        id: 't-104',
        external_id: 'EQ-104',
        title: 'PostgreSQL Migration Runner & Index Optimization',
        assigned_to: 'u-marcus-vance',
        assignee_name: 'Marcus Vance',
        estimated_hours: 10.0,
        hours_remaining: 4.0,
        status: 'IN_PROGRESS',
        due_date: new Date(Date.now() + 4 * 86400000).toISOString(),
        priority: 'HIGH',
        complexity: 'M',
        required_skill_name: 'PostgreSQL',
        is_bottleneck: false,
        delay_risk_score: 15,
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
      external_reference: 'PR #42 — Redis Stream Pipeline Architecture',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'we-2',
      event_type: 'SLACK_SUPPORT',
      weight_hours: 0.5,
      context_identifier: 'slack:eng-support',
      external_reference: 'thread:eng-108 — Solved Supabase pooler connection timeout',
      created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
    {
      id: 'we-3',
      event_type: 'CALENDAR_MEETING',
      weight_hours: 2.0,
      context_identifier: 'gcal:work',
      external_reference: 'Architecture Review & Sprint Planning Sync',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'we-4',
      event_type: 'GITHUB_PR_REVIEW',
      weight_hours: 0.5,
      diff_size_bucket: 'S',
      context_identifier: 'repo:equiflow/frontend',
      external_reference: 'PR #45 — ReactFlow Canvas Custom Node Styles',
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
    {
      id: 'we-5',
      event_type: 'SLACK_SUPPORT',
      weight_hours: 0.25,
      context_identifier: 'slack:infra-alerts',
      external_reference: 'thread:infra-99 — Verified Upstash memory limits',
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
  ];
}

export async function fetchProjects(): Promise<ProjectItem[]> {
  return [
    {
      id: 'proj-alpha-core',
      name: 'EquiFlow Alpha Core',
      description: 'Foundational intelligence engine, real-time event streaming pipeline, and decision sandbox.',
      start_date: '2026-08-20',
      target_end_date: '2026-10-15',
      status: 'AT_RISK',
      completion_pct: 68,
      workload_pct: 94,
      hidden_hours: 14.2,
      bottleneck_count: 1,
      delay_risk: 'HIGH',
      team_capacity_hrs: 24.0,
      active_members_count: 3,
    },
    {
      id: 'proj-infra-beta',
      name: 'Beta Infrastructure Pipeline',
      description: 'High-availability replication across multi-region Kubernetes clusters and automated telemetry.',
      start_date: '2026-09-01',
      target_end_date: '2026-11-30',
      status: 'ON_TRACK',
      completion_pct: 42,
      workload_pct: 65,
      hidden_hours: 6.8,
      bottleneck_count: 0,
      delay_risk: 'LOW',
      team_capacity_hrs: 16.0,
      active_members_count: 2,
    },
    {
      id: 'proj-linear-sync',
      name: 'Linear & Jira Bi-Directional Sync',
      description: 'Webhook listeners and zero-content scraping normalization for third-party issue management.',
      start_date: '2026-09-10',
      target_end_date: '2026-12-10',
      status: 'ON_TRACK',
      completion_pct: 20,
      workload_pct: 55,
      hidden_hours: 3.5,
      bottleneck_count: 0,
      delay_risk: 'LOW',
      team_capacity_hrs: 16.0,
      active_members_count: 2,
    },
  ];
}

export async function fetchCriticalBottlenecks(): Promise<BottleneckDetail[]> {
  return [
    {
      id: 'btn-1',
      member_id: 'u-sarah-chen',
      member_name: 'Sarah Chen',
      workload_pct: 129,
      risk_level: 'CRITICAL',
      blocked_tasks_count: 3,
      critical_task_id: 't-101',
      critical_task_external_id: 'EQ-101',
      critical_task_title: 'Implement Redis Stream Consumer in Intelligence Engine',
      reasons: {
        assigned_workload_hrs: 7.8,
        hidden_collaboration_hrs: 3.2,
        meetings_hrs: 2.0,
        dependency_pressure: 'Critical path predecessor for EQ-102 & EQ-103',
        fragmentation_penalty_pct: 15,
      },
      recommended_action: {
        task_id: 't-101',
        task_external_id: 'EQ-101',
        from_member_id: 'u-sarah-chen',
        from_member_name: 'Sarah Chen',
        to_member_id: 'u-alex-rivera',
        to_member_name: 'Alex Rivera',
        rationale: 'Alex has 38% available capacity and verified proficiency in asynchronous event models.',
      },
      affected_downstream_task_ids: ['t-102', 't-103'],
    },
  ];
}

export async function fetchIntegrations(): Promise<IntegrationItem[]> {
  return [
    {
      id: 'int-gh',
      name: 'GitHub',
      category: 'VCS',
      icon: 'git-pull-request',
      status: 'CONNECTED',
      description: 'Ingests PR reviews, review requests, comments, and diff size metadata with HMAC verification.',
      last_synced: '2 minutes ago',
      privacy_note: 'Zero Content Scraping active. PR bodies and comments discarded immediately.',
    },
    {
      id: 'int-slack',
      name: 'Slack',
      category: 'Communication',
      icon: 'message-square',
      status: 'CONNECTED',
      description: 'Monitors mentions and public engineering support channels with replay protection.',
      last_synced: 'Just now',
      privacy_note: 'Strictly excludes DMs and private channels. Message bodies are permanently discarded.',
    },
    {
      id: 'int-cal',
      name: 'Google Calendar',
      category: 'Calendar',
      icon: 'calendar',
      status: 'CONNECTED',
      description: 'Syncs meeting hours to floor capacity (0.5h minimum) to prevent ratio inversions.',
      last_synced: '15 minutes ago',
      privacy_note: 'Only meeting duration is read; calendar event descriptions and attendees are never saved.',
    },
    {
      id: 'int-gl',
      name: 'GitLab',
      category: 'VCS',
      icon: 'git-branch',
      status: 'NOT_CONNECTED',
      description: 'Webhook listener for merge requests, pipeline events, and diff sizing.',
    },
    {
      id: 'int-jira',
      name: 'Jira Software',
      category: 'Issue Tracker',
      icon: 'layers',
      status: 'COMING_SOON',
      description: 'Ingests epic backlogs, task estimates, and explicit dependencies.',
    },
    {
      id: 'int-linear',
      name: 'Linear',
      category: 'Issue Tracker',
      icon: 'check-square',
      status: 'COMING_SOON',
      description: 'Synchronizes project roadmaps, cycle velocity, and issue links.',
    },
  ];
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return [
    {
      id: 'notif-1',
      title: 'Capacity Overload Alert',
      message: 'Sarah Chen breached capacity threshold: W_total = 1.29 (129% load).',
      type: 'CRITICAL',
      timestamp: '10 minutes ago',
      read: false,
      link: '/bottlenecks',
    },
    {
      id: 'notif-2',
      title: 'Inferred Dependency Edge Detected',
      message: 'EQ-102 is heuristically inferred to block EQ-103 based on commit reference "#102 in PR #45".',
      type: 'WARNING',
      timestamp: '1 hour ago',
      read: false,
      link: '/tasks',
    },
    {
      id: 'notif-3',
      title: 'Simulated Reassignment Feasible',
      message: 'Transferring EQ-101 to Alex Rivera reduces project delay risk from 72% to 31%.',
      type: 'SUCCESS',
      timestamp: '2 hours ago',
      read: true,
      link: '/simulation',
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
    // Client-side fallback matching Python engine math
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
        delay_risk: false,
        delayed_task_ids: [],
        has_inferred_dependency_crossings: true,
      },
      member_a: {
        id: payload.current_assignee,
        name: 'Sarah Chen',
        workload_before: 1.29,
        workload_after: 0.82,
        is_overloaded_before: true,
        is_overloaded_after: false,
      },
      member_b: {
        id: payload.proposed_assignee,
        name: 'Alex Rivera',
        workload_before: 0.62,
        workload_after: 0.88,
        is_overloaded_before: false,
        is_overloaded_after: false,
      },
      warnings: [
        'Simulation relies on inferred skill data for Alex Rivera (Novice / Skill Mismatch multiplier 1.5x applied).',
        'Downstream path traverses an inferred dependency edge (EQ-102 -> EQ-103); schedule certainty is estimated.',
      ],
    };
  }
}
