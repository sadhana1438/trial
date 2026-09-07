# EquiFlow (v2)

**EquiFlow** is an intelligent, dependency-aware workload management and decision-support platform (**Intelligence Overlay**). It ingests task data from existing systems (Jira, Linear) and merges it with passive activity metadata (GitHub, Slack, Google Calendar) to compute the true state of team capacity, burnout risks, and critical-path project health.

---

## System Architecture

```
equiflow/
├── database/                    # PostgreSQL 15 DDL, seeds, schema integrity tests
├── services/
│   ├── ingestion/               # Node.js + Express Webhook Gateway & WebSocket Relay
│   ├── intelligence/            # Python 3.12 + FastAPI Scoring & NetworkX Simulation Engine
│   └── frontend/                # Next.js (App Router), React 18, ReactFlow, TailwindCSS
├── .agents/rules/               # Persisted Master Specification v2 Workspace Rule
└── .env                         # Canonical environment configuration
```

---

## Core Algorithms & Mathematical Models

### 1. Total Workload Formula ($W_{total}$)
$$W_{total} = \left( \frac{T_{assigned} + H_{tracked}}{\max(C_{capacity} - M_{meetings}, 0.5)} \right) \times F_{fragmentation}$$
- Overloaded when $W_{total} > 1.0$.
- PR reviews weighted by diff size: XS (0.25h), S (0.5h), M (0.75h), L (1.25h), XL (2.0h).
- $T_{assigned}$ prorated across remaining business days until task due dates.
- Denominator floored at $0.5h$ minimum.

### 2. Cognitive Load / Fragmentation ($F_{fragmentation}$)
- Sliding 4-hour window context switch counter.
- First 2 switches are free; $+0.05$ penalty per switch beyond 2; capped at $1.5\times$ max.

### 3. "What-If" Simulation Engine
$$E_{new} = (E_{remaining} \times S_{multiplier}) + H_{handoff}$$
- $S_{multiplier}$: Expert (0.8), Standard (1.0), Novice/Mismatch (1.5).
- $H_{handoff}$: $10\%$ of estimated hours (min 1h) if `IN_PROGRESS`; $0h$ if `TODO`.
- Critical Path forward-pass traversal (NetworkX) detecting deadline breaches (`delay_risk = true`).
- Inferred dependency edges (`strokeDasharray: '5, 5'`) and inferred skills flagged as low-confidence.

---

## Automated Test Verification

Run all test suites across the monorepo:
```bash
# 1. Database Schema Integrity (PostgreSQL 15)
npm run test:db

# 2. Ingestion Service (Vitest)
npm run test:ingestion

# 3. Intelligence Engine (Pytest)
npm run test:intelligence

# 4. Frontend Styling & DAG (Vitest)
npm run test:frontend

# Run all 49 tests in sequence:
npm run test:all
```

---

## Local Development Execution

### 1. Ingestion Service (Node.js)
```bash
npm run dev:ingestion
# Webhooks at: http://localhost:3001/api/webhooks/github
# WebSocket relay at: ws://localhost:3001/ws/alerts
```

### 2. Intelligence Engine (FastAPI)
```bash
npm run dev:intelligence
# API at: http://localhost:8000
# OpenAPI Docs: http://localhost:8000/docs
```

### 3. Stream Consumer Worker (Python)
```bash
.\.venv\Scripts\python.exe services/intelligence/app/worker/stream_consumer.py
```

### 4. Next.js Frontend
```bash
npm run dev:frontend
# Open: http://localhost:3000
```
