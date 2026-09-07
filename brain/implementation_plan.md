# EquiFlow (v2) — Implementation Plan & Module Specifications

## Status Summary

- [x] **Task 1: Database Schema & Migrations Foundation** — **COMPLETED & VERIFIED** (7/7 tests passed on live Supabase instance).
- [x] **Task 2: Ingestion Service & Event Broker Pipeline** — **COMPLETED & VERIFIED** (19/19 tests passed across 5 test suites).
- [ ] **Task 3: Intelligence Engine — Workload Scoring & Stream Worker** — **NEXT (Ready for Review)**
- [ ] **Task 4: "What-If" Simulation Engine & DAG Bottleneck Traversal**
- [ ] **Task 5: Frontend Dashboard & Decision Sandbox**

---

## Task 3 Detailed Implementation Plan: Intelligence Engine — Workload Scoring & Stream Worker

### Scope & Architectural Boundaries (Specs 3.1, 4.1, 4.2)
1. **Redis Streams Consumer Group Worker**:
   - Creates/joins consumer group `equiflow:intelligence:workers` on stream `equiflow:events:stream`.
   - Reads incoming JSON messages with `XREADGROUP` and acknowledges with `XACK`.
   - Maps `user_identifier` (GitHub username / Slack ID) to `users.id` in PostgreSQL.
   - Categorizes event into `work_events` table:
     - PR Reviews: computes size-based weight (XS=0.25h, S=0.5h, M=0.75h, L=1.25h, XL=2.0h).
     - Slack Support: 0.25h per thread.
     - PR Comments: 0.15h per comment.
     - Calendar Meetings: records hours into `M_meetings`.
2. **Workload Scoring Engine (`W_total`)**:
   - Formula:
     $$W_{total} = \left( \frac{T_{assigned} + H_{tracked}}{\max(C_{capacity} - M_{meetings}, 0.5)} \right) \times F_{fragmentation}$$
   - **$T_{assigned}$**: Sum of `hours_remaining / max(business_days_until_due, 1)` across all open tasks assigned to user. Fallback 4.0 hrs if unestimated.
   - **$H_{tracked}$**: Dynamically computed hidden work:
     $$H_{tracked} = \sum PR\_reviews\_weighted + (Slack\_threads \times 0.25) + (PR\_comments \times 0.15)$$
   - **$F_{fragmentation}$**: Base 1.0. No penalty for the first 2 distinct `context_identifier` switches in a sliding 4-hour window. Each switch beyond 2 adds +0.05, capped at a maximum of 1.5x.
   - **Formula Versioning**: Every score written to `workload_scores` with `formula_version: 'v2.0.0'`.
   - **Real-Time Overload Alert**: If $W_{total} > 1.0$, publish alert event to Redis Pub/Sub channel `equiflow:alerts`.
3. **FastAPI Application**:
   - `/health`: Health status.
   - `/api/scores/{user_id}`: Returns latest workload score, breakdown (T_assigned, H_tracked, M_meetings, F_fragmentation), and historical scores.
   - `/api/projects/{project_id}/scores`: Aggregated project team scores.

### Files to Create in Task 3
- [NEW] `services/intelligence/pyproject.toml`: Dependencies (`fastapi`, `uvicorn`, `redis`, `sqlalchemy`, `psycopg2-binary`, `pydantic`, `pytest`, `httpx`).
- [NEW] `services/intelligence/tests/test_workload_formulas.py`: Unit tests for mathematical boundary conditions:
  - Denominator floored at 0.5 (prevent division by zero or negative ratio).
  - Prorated daily `T_assigned` calculation.
  - Diff size weighting for PR reviews (XS/S/M/L/XL).
  - Fragmentation 4-hour sliding window: 0 switches, 2 switches (no penalty), 5 switches (+0.15), 15 switches (capped at 1.5x).
  - Overload threshold detection ($W_{total} > 1.0$).
- [NEW] `services/intelligence/tests/test_stream_worker.py`: Integration test reading from mock/stream and writing to `work_events` & `workload_scores`.
- [NEW] `services/intelligence/app/core/config.py`: Application settings.
- [NEW] `services/intelligence/app/core/database.py`: SQLAlchemy engine & session factory.
- [NEW] `services/intelligence/app/core/redis.py`: Redis client connection.
- [NEW] `services/intelligence/app/engine/fragmentation.py`: 4-hour sliding window algorithm.
- [NEW] `services/intelligence/app/engine/workload.py`: $W_{total}$, $T_{assigned}$, $H_{tracked}$ calculators.
- [NEW] `services/intelligence/app/worker/stream_consumer.py`: Consumer group event loop.
- [NEW] `services/intelligence/app/api/scores.py`: Score query API endpoints.
- [NEW] `services/intelligence/app/main.py`: FastAPI server entry point.

### Verification Plan for Task 3
```powershell
.\.venv\Scripts\pytest.exe services/intelligence/tests/test_workload_formulas.py -v
```
