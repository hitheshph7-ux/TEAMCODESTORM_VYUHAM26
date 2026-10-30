# VYUHAM – Autonomous AI-Based Workflow Orchestration Platform

<div align="center">
  <h3>🚀 An intelligent, multi-agent workflow engine with human-in-the-loop control</h3>
  <p>Built for CODESTORM Hackathon 2026</p>
</div>

---

## 🧠 Problem Statement

Organizations routinely perform complex workflows involving multiple applications, data sources, approvals and dependencies. Manual coordination is slow, difficult to audit and vulnerable to interruptions when tasks fail or requirements change.

## 💡 Solution

VYUHAM converts high-level natural-language objectives into executable plans, delegates tasks to specialized AI agents, monitors progress, recovers from failures automatically, and pauses for human approval before consequential actions — all with a complete auditable trail.

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| 🤖 **4 Specialized Agents** | Planner, Executor, Monitor, Recovery |
| 🔗 **LangGraph Orchestration** | Stateful, conditional workflow graph |
| 👤 **Human-in-the-Loop** | Pause → Approve/Reject → Resume |
| 🔄 **Auto Recovery** | Bounded retries with delay policies |
| 📊 **Dependency Management** | DAG validation with cycle detection |
| 📝 **Immutable Audit Trail** | Every action logged permanently |
| 🎨 **React Dashboard** | Real-time workflow visualization |
| 🔀 **AI + Demo Mode** | Works with or without Claude API key |

---

## 🏗️ System Architecture

```
User Objective (Natural Language)
         │
         ▼
┌─────────────────────────────────────┐
│         LangGraph State Machine      │
│                                     │
│  PLANNER → EXECUTOR → MONITOR       │
│                ↑          ↓         │
│           RECOVERY ←── FAILURE      │
│                          ↓          │
│         HUMAN APPROVAL (if needed)  │
│                          ↓          │
│              AUDIT LOG → END        │
└─────────────────────────────────────┘
         │
         ▼
   FastAPI + SQLite Backend
         │
         ▼
   React Dashboard (Real-time)
```

---

## 🛠️ Technology Stack

**Backend:**
- Python 3.14, FastAPI, SQLAlchemy, SQLite
- LangGraph 1.x, LangChain, langchain-anthropic
- Pydantic v2, python-dotenv

**Frontend:**
- React 18, TypeScript, Vite
- Tailwind CSS, @xyflow/react, Lucide Icons
- React Router v6, Axios

**AI:**
- Anthropic Claude (claude-3-haiku for planning – cost efficient)
- Demo mode with deterministic templates (no API cost)

---

## 📁 Project Structure

```
CODESTORM_VYUHAM26/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── api/routes/          # REST API endpoints
│   │   ├── agents/              # Planner, Executor, Monitor, Recovery
│   │   ├── orchestration/       # LangGraph state graph
│   │   ├── tools/               # Business tool registry
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # CRUD services & audit logging
│   │   └── core/                # Config, database setup
│   ├── tests/                   # 35 automated tests
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Workflows, Approvals, etc.
│   │   ├── components/          # Reusable UI components
│   │   ├── services/            # API service layer
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Helper functions
│   └── package.json
│
└── docs/
    └── architecture.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.11+ (tested on 3.14)
- Node.js 18+ and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/hitheshph7-ux/CODESTORM_VYUHAM26.git
cd CODESTORM_VYUHAM26
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env to add your ANTHROPIC_API_KEY (optional for demo mode)

# Start the backend
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## ⚙️ Environment Configuration

Edit `backend/.env`:

```env
# Required for AI mode
ANTHROPIC_API_KEY=sk-ant-your-key-here

# "demo" = no API key needed | "ai" = uses Claude
EXECUTION_MODE=demo
```

---

## 🎮 Demo Instructions

### Demo 1: Employee Onboarding with Approval

1. Open the dashboard at http://localhost:5173
2. Click **"New Workflow"**
3. Select **Demo Mode**
4. Enter this objective:
   > *"Onboard a new employee named Rahul. Create an employee record, prepare an onboarding email, request manager approval before sending it, and assign mandatory training."*
5. Click **"Create & Start Workflow"**
6. Watch tasks execute in real-time
7. When workflow pauses → go to **Approval Center**
8. Click **Approve** on the pending email action
9. Workflow resumes and completes automatically
10. Check **Audit Logs** to see every operation

### Demo 2: Failure Recovery

1. Create a new workflow with the same objective
2. Enable **"Simulate task failure"** checkbox
3. Watch the Recovery Agent retry failed tasks
4. See retry counts in the Workflow Details page

---

## 🧪 Testing

```bash
cd backend
source venv/bin/activate

# Run all tests
python -m pytest tests/ -v

# Run specific test categories
python -m pytest tests/test_health.py -v
python -m pytest tests/test_workflows.py -v
python -m pytest tests/test_dependencies.py -v
python -m pytest tests/test_approvals.py -v
python -m pytest tests/test_agents.py -v
```

Expected: **35 tests passing**

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workflows` | Create a new workflow |
| `GET` | `/api/workflows` | List all workflows |
| `GET` | `/api/workflows/{id}` | Get workflow details |
| `POST` | `/api/workflows/{id}/start` | Start workflow execution |
| `POST` | `/api/workflows/{id}/resume` | Resume paused workflow |
| `POST` | `/api/workflows/{id}/cancel` | Cancel workflow |
| `GET` | `/api/workflows/{id}/tasks` | Get workflow tasks |
| `GET` | `/api/workflows/{id}/logs` | Get execution logs |
| `GET` | `/api/workflows/{id}/graph` | Get visualization data |
| `GET` | `/api/approvals` | List all approvals |
| `POST` | `/api/approvals/{id}/approve` | Approve an action |
| `POST` | `/api/approvals/{id}/reject` | Reject an action |
| `GET` | `/api/logs` | Get audit logs (filterable) |
| `GET` | `/health` | System health check |

---

## 🤖 Agent Descriptions

| Agent | Role |
|-------|------|
| **Planner** | Converts NL objectives → structured tasks with dependencies |
| **Executor** | Runs registered business tools safely |
| **Monitor** | Tracks progress, evaluates dependencies, detects completion |
| **Recovery** | Classifies errors, schedules retries, marks permanent failures |

---

## 📜 License

MIT License – Built for CODESTORM 2026 Hackathon

---

<div align="center">
  Built with ❤️ using FastAPI, LangGraph, React & Anthropic Claude
</div>