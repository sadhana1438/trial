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
  assigned_hours?: number;
  hidden_hours?: number;
  meeting_hours?: number;
  support_contributions?: number;
  pr_reviews_count?: number;
  rework_percentage?: number;
  interruption_rate?: number;
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
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  complexity?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  required_skill_id?: string;
  required_skill_name?: string;
  blocked_by?: string[];
  blocks?: string[];
  is_bottleneck?: boolean;
  delay_risk_score?: number; // 0-100
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

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  start_date: string;
  target_end_date: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  completion_pct: number;
  workload_pct: number;
  hidden_hours: number;
  bottleneck_count: number;
  delay_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  team_capacity_hrs: number;
  active_members_count: number;
}

export interface BottleneckDetail {
  id: string;
  member_id: string;
  member_name: string;
  workload_pct: number;
  risk_level: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  blocked_tasks_count: number;
  critical_task_id: string;
  critical_task_external_id: string;
  critical_task_title: string;
  reasons: {
    assigned_workload_hrs: number;
    hidden_collaboration_hrs: number;
    meetings_hrs: number;
    dependency_pressure: string;
    fragmentation_penalty_pct: number;
  };
  recommended_action: {
    task_id: string;
    task_external_id: string;
    from_member_id: string;
    from_member_name: string;
    to_member_id: string;
    to_member_name: string;
    rationale: string;
  };
  affected_downstream_task_ids: string[];
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: 'VCS' | 'Issue Tracker' | 'Communication' | 'Calendar';
  icon: string;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'COMING_SOON';
  description: string;
  last_synced?: string;
  privacy_note?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'CRITICAL' | 'SUCCESS' | 'INFO';
  timestamp: string;
  read: boolean;
  link?: string;
}
