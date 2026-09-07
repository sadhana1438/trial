# EquiFlow — Master System Specification (v2)

## 0. Changelog — fixes applied since v1

| Area | v1 problem | v2 fix |
|---|---|---|
| W_total formula | Denominator `(C_capacity − M_meetings)` could hit 0 or negative | Floored at a minimum of 0.5 hrs |
| W_total formula | `T_assigned` (backlog total) and `C_capacity` (per-day) were different time scales | `T_assigned` redefined as hours-due-today, prorated across days remaining until each task's due date |
| Fragmentation score | Uncapped `+0.05` per switch penalized normal multi-repo review work | No penalty for the first 2 switches in a 4-hr window; multiplier capped at 1.5x |
| PR review weight | Flat 0.75 hrs regardless of size, gameable | Weighted by diff size (S/M/L/XL buckets) |
| Skill proficiency | Required manual 1–3 ratings, contradicting "zero manual entry" | Inferred by default from commit/PR history per repo/language; manual override allowed, source is tracked |
| Reassignment simulation | No cost for handing off in-progress work | Added a handoff/ramp-up penalty on top of the skill multiplier |
| Message broker | "Redis (Celery/BullMQ)" — Node and Python don't share a queue format | Redis Streams with a documented cross-language JSON schema |
| Real-time alerts | Two services both implied to own the WebSocket connection | Python publishes to Redis pub/sub; Node (which already holds client connections) relays to React |
| Schema | No `projects` table despite a project-scoped dashboard view | Added `projects`, with `project_id` FK on `tasks` |
| Schema | `tasks.external_id` had no uniqueness constraint | Unique constraint added; indexes called out on high-traffic FKs |
| Schema | No way to compare scores after formula tuning | `workload_scores` table stores each computed score with a `formula_version` |
| Bottleneck detection | Assumes complete dependency data; most teams under-fill "blocked by" links | Dependencies get a `confidence` flag (explicit vs. inferred from PR/commit references); UI shows inferred edges distinctly |
| Privacy | Labeling ("Collaboration Hours") was the only stated safeguard | Explicit employee notice/consent flow and a stated retention limit added |

---

## 1. Executive Summary & Product Vision

**Project Name:** EquiFlow
**Definition:** An intelligent, dependency-aware workload management and decision-support platform.
**Mission:** To eliminate developer burnout and project delays by quantifying "invisible work" (code reviews, ad-hoc support, context switching) and providing managers with a "What-If" simulation engine to test workload redistributions before executing them.
**Platform Paradigm:** EquiFlow is **not** a standalone task manager. It is an **Intelligence Overlay**. It ingests task data from existing systems (Jira, Linear) and merges it with passive activity metadata (GitHub, Slack, Google Calendar) to compute the *true* state of a team's capacity and project health.

## 2. Core Innovations & Functional Pillars

### A. Automated Context Harvesting

Developers do not log time. EquiFlow calculates hidden work via webhooks:

* **GitHub/GitLab:** Listens for `pull_request.review_requested`, `pull_request_review.submitted`, `issue_comment.created`, and `push` events — including diff size (files changed, lines changed) for review weighting.
* **Slack/MS Teams:** Listens for `app_mention` and thread replies in designated public channels (e.g., `#engineering-support`).
* **Calendars:** Syncs via OAuth to deduct meeting times from raw capacity.
* **Skill proficiency (new in v2):** Inferred automatically from merged-PR history per repo/language (e.g., PR volume and review-approval rate over a trailing 90 days). This keeps the "zero manual entry" promise consistent — proficiency is a derived signal, not a form managers fill out. A manual override is available per user/skill and is tagged `source: manual` vs. `source: inferred` so simulations can flag when they're relying on a stale or unset estimate.

### B. Fragmentation Scoring (Cognitive Load Penalty)

Switching contexts drains engineering velocity, but a healthy amount of it is normal for senior/review-heavy roles. EquiFlow tracks event variance in a sliding 4-hour window and only penalizes past a threshold (see 3.1) — routine multi-repo review work should not itself trigger a fragmentation flag.

### C. Dependency-Aware Bottleneck Prediction

Tasks are modeled as a Directed Acyclic Graph (DAG). EquiFlow calculates the Critical Path. Because most teams don't consistently fill in "blocked by" links, dependency edges carry a `confidence` value:

* `explicit` — pulled directly from Jira/Linear's own dependency field.
* `inferred` — mined heuristically from PR descriptions ("closes #123", "blocked by #456") and commit message references.

The dashboard visually distinguishes inferred edges (e.g., dashed lines) so a manager doesn't mistake a low-confidence guess for confirmed data.

### D. The "What-If" Simulation Engine

Before changing assignments, the engine runs a hypothetical graph calculation:

1. Removes Task X from Member A.
2. Assigns Task X to Member B.
3. Applies a **Skill Proficiency Multiplier**.
4. Applies a **Handoff Penalty** if Task X is already in progress (see 3.2).
5. Recalculates the DAG to ensure Member B's new timeline doesn't push dependent tasks past project deadlines.

## 3. Mathematical Models & Scoring Algorithms

### 3.1 Total Workload Formula

```
W_total = ( (T_assigned + H_tracked) / max(C_capacity - M_meetings, 0.5) ) × F_fragmentation
```

If `W_total > 1.0`, the user is overloaded.

**Variables & calculation rules:**

* **T_assigned** — hours *due today*, not raw backlog total. For each open task assigned to the user:
  `task_contribution = hours_remaining / max(business_days_until_due, 1)`
  Sum across all open tasks. This keeps `T_assigned` on the same daily time scale as `C_capacity`, so a task due in three weeks doesn't inflate today's score the same way a task due tomorrow does. (Fallback: 4 hours remaining if unestimated.)

* **H_tracked** — hidden work, dynamically calculated:
  ```
  H_tracked = (PR_reviews_weighted) + (Slack_threads × 0.25) + (PR_comments × 0.15)
  ```
  `PR_reviews_weighted` sums each reviewed PR at a size-based weight instead of a flat rate:

  | Diff size (files/lines changed) | Weight (hrs) |
  |---|---|
  | XS (≤1 file, <20 lines) | 0.25 |
  | S (≤3 files, <100 lines) | 0.5 |
  | M (≤10 files, <400 lines) | 0.75 |
  | L (≤25 files, <1000 lines) | 1.25 |
  | XL (beyond L) | 2.0 |

* **C_capacity** — standard capacity (default 8 hrs/day).

* **M_meetings** — total calendar-event hours for the timeframe. The denominator is floored at 0.5 so a meeting-saturated day can't zero out or invert the score; a day with `C_capacity - M_meetings < 0.5` should instead surface as its own state ("no task-work capacity today") rather than being blended into the ratio.

* **F_fragmentation** — base 1.0. No penalty for the first 2 distinct project/repo switches detected in a sliding 4-hour window. Each additional switch beyond 2 adds +0.05, capped at a 1.5x multiplier total.

Every computed `W_total` is stored with a `formula_version` (see schema, 5) so historical trends stay comparable if the weights above are ever retuned.

### 3.2 Skill-Weighted Time Estimation (Simulation)

```
E_new = (E_remaining × S_multiplier) + H_handoff
```

* **E_remaining** — remaining estimated hours on the task (not the original full estimate, if work is already in progress).
* **S_multiplier:**
  * Expert Match: 0.8
  * Standard Match: 1.0
  * Novice / Skill Mismatch: 1.5–2.0
* **H_handoff** — ramp-up/context-transfer cost, applied only when the task is already `IN_PROGRESS` at the time of reassignment. Default: 10% of the task's original estimated hours, minimum 1 hour. This prevents the simulation from treating a mid-flight handoff as a clean, zero-cost swap.

## 4. Technical Architecture & Microservices

Event-driven microservices architecture.

### 4.1 Tech Stack

* **Frontend:** React 18, Next.js (App Router), TailwindCSS, Recharts (data viz), ReactFlow (DAG/dependency visualization — renders inferred edges as dashed).
* **API Gateway & Ingestion (Node.js):** Express.js, built for high I/O throughput on webhook ingestion.
* **Message Broker:** **Redis Streams** (Node writes ingestion events as JSON to a shared stream using a documented schema; Python worker consumes via a consumer group).
* **Intelligence Engine (Python):** FastAPI, Pandas, NetworkX (DAG traversal), Scikit-learn (anomaly detection).
* **Database:** PostgreSQL 15.
* **Real-time alerts:** Python publishes score-threshold events to Redis pub/sub. Node subscribes and relays to React over WebSockets.

### 4.2 Data Flow Pipeline

1. **Ingestion:** Webhook payload sent to Node.
2. **Queuing:** Node validates signature and writes event to Redis Stream.
3. **Processing:** Python worker consumes stream, categorizes work, computes time weight.
4. **Storage:** Worker writes `work_events` to PostgreSQL.
5. **Analytics:** Python recalculates `W_total` and writes to `workload_scores`.
6. **Real-Time Update:** If `W_total > 1.0`, Python publishes to Redis pub/sub; Node relays over WebSocket to React.

## 5. Database Schema (PostgreSQL)

**Table: `projects`**
* `id` (UUID, PK)
* `name` (String)
* `description` (Text)
* `start_date` (Timestamp)
* `target_end_date` (Timestamp)

**Table: `users`**
* `id` (UUID, PK)
* `name` (String)
* `role` (String)
* `github_username` (String, Unique)
* `slack_id` (String, Unique)
* `daily_capacity` (Float) — default 8.0

**Table: `skills`** / **`user_skills`** (many-to-many)
* `skill_id` (UUID, PK), `skill_name` (String)
* `user_id` (FK), `skill_id` (FK), `proficiency_level` (Int 1–3), `source` (Enum: `inferred`, `manual`), `last_computed_at` (Timestamp)

**Table: `tasks`** (ingested from Jira/Linear)
* `id` (UUID, PK)
* `external_id` (String)
* `project_id` (UUID, FK -> projects)
* `title` (String)
* `assigned_to` (UUID, FK -> users, indexed)
* `estimated_hours` (Float)
* `hours_remaining` (Float)
* `status` (Enum: TODO, IN_PROGRESS, DONE)
* `due_date` (Timestamp)
* Unique constraint on `(external_id, project_id)`

**Table: `task_dependencies`** (the DAG)
* `id` (UUID, PK)
* `blocking_task_id` (UUID, FK -> tasks, indexed)
* `dependent_task_id` (UUID, FK -> tasks, indexed)
* `confidence` (Enum: `explicit`, `inferred`)

**Table: `work_events`** (hidden work ledger)
* `id` (UUID, PK)
* `user_id` (UUID, FK -> users, indexed)
* `event_type` (Enum: GITHUB_PR_REVIEW, SLACK_SUPPORT, GITHUB_COMMENT, CALENDAR_MEETING)
* `event_weight_hours` (Float)
* `diff_size_bucket` (Enum: XS, S, M, L, XL, nullable)
* `external_reference` (String)
* `created_at` (Timestamp, indexed)

**Table: `workload_scores`**
* `id` (UUID, PK)
* `user_id` (UUID, FK -> users, indexed)
* `w_total` (Float)
* `formula_version` (String)
* `computed_at` (Timestamp, indexed)

## 6. The "What-If" Simulation Execution Flow

Frontend payload on `[Simulate Reassignment]`:
```json
{
  "action": "SIMULATE_REASSIGNMENT",
  "task_id": "uuid-of-task-17",
  "current_assignee": "uuid-member-A",
  "proposed_assignee": "uuid-member-B"
}
```

Python engine execution steps:
1. Clone state: In-memory clone of current task/dependency DAG.
2. Calculate skill delta: Fetch `user_skills` for Member B (respecting `source`, and flagging if `inferred` and low-confidence). Output `S_multiplier`.
3. Adjust duration: `E_new = E_remaining × S_multiplier + H_handoff` if task is `IN_PROGRESS`; else `H_handoff = 0`.
4. Traverse DAG: Walk dependency tree forward from task with NetworkX. Add new duration to dependent tasks' start times. Tag traversal crossing `inferred`-confidence edge.
5. Check deadlines: If downstream task projected completion exceeds `due_date`, flag `delay_risk = true`.
6. Recalculate workloads: Run `W_total` for both Member A and Member B under simulated state.
7. Return payload: Before/After JSON with flags.

## 7. Frontend UI / UX Topography

1. Macroscopic View (Project Health) — scoped by `project_id`.
2. Microscopic View (Team Member Profile).
3. Simulation Sandbox (Decision UI).

## 8. Data Privacy & Ethical Constraints

* No Content Scraping: Discard message text immediately; metadata only.
* No Private Snooping: DMs and private channels excluded.
* Constructive Analytics: Label hidden work as "Cross-Team Support" / "Collaboration Hours."
* Employee notice & consent: Documented notice and consent workflow.
* Data retention limit: 90-day retention window for raw `work_events`.
