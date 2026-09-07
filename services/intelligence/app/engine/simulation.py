from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Tuple
import networkx as nx

from app.engine.skills import calculate_skill_multiplier


@dataclass
class TaskNode:
    task_id: str
    title: str
    assigned_to: Optional[str]
    estimated_hours: float
    hours_remaining: float
    status: str  # 'TODO', 'IN_PROGRESS', 'DONE'
    due_date: Optional[datetime]
    required_skill_id: Optional[str] = None


@dataclass
class DependencyEdge:
    blocking_task_id: str
    dependent_task_id: str
    confidence: str  # 'explicit' or 'inferred'


def calculate_handoff_penalty(status: str, estimated_hours: float) -> float:
    """
    Spec Section 3.2:
    H_handoff applied only when task is already IN_PROGRESS at the time of reassignment.
    Default: 10% of task's original estimated hours, minimum 1.0 hr.
    """
    if status == "IN_PROGRESS":
        penalty = 0.10 * float(estimated_hours)
        return max(penalty, 1.0)
    return 0.0


def calculate_adjusted_duration(
    hours_remaining: float,
    estimated_hours: float,
    status: str,
    s_multiplier: float,
) -> float:
    """
    Spec Section 3.2:
    E_new = (E_remaining * S_multiplier) + H_handoff
    """
    h_handoff = calculate_handoff_penalty(status, estimated_hours)
    return (float(hours_remaining) * s_multiplier) + h_handoff


def run_what_if_simulation(
    task_id: str,
    current_assignee_id: str,
    proposed_assignee_id: str,
    proposed_assignee_skill_level: Optional[int],
    proposed_assignee_skill_source: str,
    tasks: Dict[str, TaskNode],
    dependencies: List[DependencyEdge],
    reference_time: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Master Spec Section 6:
    Execute hypothetical graph calculation on [Simulate Reassignment].
    Applies Critical Path Method (CPM) forward-pass traversal.
    """
    if reference_time is None:
        reference_time = datetime.utcnow()

    ref_clean = reference_time.replace(tzinfo=None) if reference_time.tzinfo else reference_time

    target_task = tasks.get(task_id)
    if not target_task:
        raise ValueError(f"Task {task_id} not found in project task graph")

    # 1. Calculate skill delta & multiplier
    s_multiplier, is_inferred_skill = calculate_skill_multiplier(
        proficiency_level=proposed_assignee_skill_level,
        source=proposed_assignee_skill_source,
    )

    # 2. Adjust duration & handoff penalty
    h_handoff = calculate_handoff_penalty(target_task.status, target_task.estimated_hours)
    e_new = (target_task.hours_remaining * s_multiplier) + h_handoff
    duration_delta_hours = e_new - target_task.hours_remaining

    # 3. Construct NetworkX DAG
    dag = nx.DiGraph()
    for t_id, task in tasks.items():
        dag.add_node(t_id, task=task)

    for edge in dependencies:
        if edge.blocking_task_id in tasks and edge.dependent_task_id in tasks:
            dag.add_edge(edge.blocking_task_id, edge.dependent_task_id, confidence=edge.confidence)

    # 4. Critical Path Forward Pass Schedule
    # Standard 8 hours/day pacing
    # Topological sort for acyclic dependencies
    try:
        topo_order = list(nx.topological_sort(dag))
    except nx.NetworkXUnfeasible:
        topo_order = list(tasks.keys())

    # Map of projected completion times
    projected_completions: Dict[str, datetime] = {}
    delay_risk = False
    delayed_tasks: List[str] = []

    for t_id in topo_order:
        t = tasks[t_id]
        # Duration in hours
        duration_hrs = e_new if t_id == task_id else t.hours_remaining
        duration_days = duration_hrs / 8.0

        # Start time is max of reference_time and all predecessors' completion times
        predecessors = list(dag.predecessors(t_id))
        if not predecessors:
            start_time = ref_clean
        else:
            pred_completions = [projected_completions[p] for p in predecessors if p in projected_completions]
            start_time = max([ref_clean] + pred_completions)

        completion_time = start_time + timedelta(days=duration_days)
        projected_completions[t_id] = completion_time

        # Check deadline breach
        if t.due_date:
            due_clean = t.due_date.replace(tzinfo=None) if t.due_date.tzinfo else t.due_date
            if completion_time > due_clean:
                delay_risk = True
                delayed_tasks.append(t_id)

    # 5. Identify Inferred Edge Crossings
    descendants = nx.descendants(dag, task_id) if task_id in dag else set()
    has_inferred_crossings = False
    inferred_edge_tasks: Set[str] = set()

    for desc in descendants:
        for path in nx.all_simple_paths(dag, source=task_id, target=desc):
            for i in range(len(path) - 1):
                edge_data = dag.get_edge_data(path[i], path[i + 1]) or {}
                if edge_data.get("confidence") == "inferred":
                    has_inferred_crossings = True
                    inferred_edge_tasks.add(desc)

    return {
        "action": "SIMULATE_REASSIGNMENT",
        "task_id": task_id,
        "current_assignee": current_assignee_id,
        "proposed_assignee": proposed_assignee_id,
        "e_remaining_original": target_task.hours_remaining,
        "s_multiplier": s_multiplier,
        "is_inferred_skill": is_inferred_skill,
        "h_handoff": h_handoff,
        "e_new": round(e_new, 2),
        "duration_delta_hours": round(duration_delta_hours, 2),
        "delay_risk": delay_risk,
        "delayed_task_ids": list(set(delayed_tasks)),
        "downstream_impacted_task_count": len(descendants),
        "has_inferred_dependency_crossings": has_inferred_crossings,
        "inferred_edge_downstream_tasks": list(inferred_edge_tasks),
    }
