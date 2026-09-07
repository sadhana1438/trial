export interface UserScoreSummary {
  user_id: string;
  name: string;
  role: string;
  github_username: string;
  daily_capacity: number;
  w_total: number | null;
  is_overloaded: boolean;
  formula_version: string | null;
  last_computed_at: string | null;
}

export interface TaskItem {
  id: string;
  external_id: string;
  title: string;
  assigned_to: string;
  assignee_name?: string;
  estimated_hours: number;
  hours_remaining: number;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  due_date: string | null;
  required_skill_id?: string;
  required_skill_name?: string;
}

export interface DependencyItem {
  id: string;
  blocking_task_id: string;
  dependent_task_id: string;
  confidence: 'explicit' | 'inferred';
}

export interface WorkEventItem {
  id: string;
  event_type: 'GITHUB_PR_REVIEW' | 'SLACK_SUPPORT' | 'GITHUB_COMMENT' | 'CALENDAR_MEETING';
  weight_hours: number;
  diff_size_bucket?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  context_identifier: string;
  external_reference: string;
  created_at: string;
}

export interface SimulationResult {
  status: string;
  action: string;
  task: {
    id: string;
    external_id: string;
    title: string;
    status: string;
    original_hours_remaining: number;
    new_hours_remaining: number;
    duration_delta_hours: number;
  };
  simulation_factors: {
    s_multiplier: number;
    is_inferred_skill: boolean;
    h_handoff: number;
    delay_risk: boolean;
    delayed_task_ids: string[];
    has_inferred_dependency_crossings: boolean;
  };
  member_a: {
    id: string;
    name: string;
    workload_before: number;
    workload_after: number;
    is_overloaded_before: boolean;
    is_overloaded_after: boolean;
  };
  member_b: {
    id: string;
    name: string;
    workload_before: number;
    workload_after: number;
    is_overloaded_before: boolean;
    is_overloaded_after: boolean;
  };
  warnings: string[];
}
