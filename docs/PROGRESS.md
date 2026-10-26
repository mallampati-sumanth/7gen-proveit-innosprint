# ProveIt Progress Log

## Finished Phases
- [x] **PHASE 0: Scaffold**: Complete repo layout (`frontend/`, `backend/`, `infra/`, `model/`, `sample_app/`), SQLModel SQLite + Supabase (PostgreSQL) dual support, config with `pydantic-settings`, `/health` & `/api/auth/login` endpoints, `pytest.ini`, `docker-compose.yml`, Makefile, and sample Flask target app.
- [x] **AUTONOMOUS DEPLOYMENT AGENT (GITHUB TO EC2 WITH PER-REPO .ENV INJECTION)**:
  - **100% Dynamic GitHub REST API (No Static Data / Zero Fake Fallbacks)**:
    - Real GitHub authentication via Personal Access Token (`POST /api/agent/github/connect`) with real scopes, avatar, username, and public/private repo synchronization.
    - Real repository URL inspection (`POST /api/agent/repos`) dynamically fetching live manifest files (`requirements.txt`, `package.json`, `Dockerfile`, commit SHA, default branch) from `https://api.github.com/repos/{owner}/{repo}`.
    - Zero static mock repos or fallback user accounts. Empty states guide the user cleanly with interactive GitHub PAT connection modal or URL quick-adds.
  - **Per-Repository .env Injection Studio**:
    - Isolated environment variable management per repository (`RepoEnvVar` SQLModel). Structured Key-Value table and Raw `.env` code editor with masking, export, real stack auto-detection (`POST /api/agent/repos/{id}/env/generate`), and target sync.
  - **EC2 Fleet Management**:
    - Configured and live-discovered EC2 nodes (`EC2Instance` SQLModel) with SSH port 22 verification, Docker daemon health status, ping latency, and running containers list.
  - **Autonomous Agent Execution Loop**:
    - Multi-step pipeline: (1) Repo Manifest & Commit SHA check, (2) Repo .env Injection, (3) EC2 Handshake, (4) Blast Radius Safety Gate, (5) Docker Deployment on EC2, (6) Live Health Probe (`http://<ec2-ip>:<port>/health`), (7) Self-Healing Loop, (8) Cryptographic Proof & Hash-chained Ledger commit.
  - **Next.js 14 SaaS UI**:
    - Comprehensive full-scale dashboard with dedicated tabs for Repositories, Repo .env Injector, EC2 Fleet, Autonomous Chat Console, Modal Wizard, and live SSE streaming.

## File List & Purposes
- `README.md`: Project summary, architecture, and team info.
- `.env.example`: Template for environment variables, secrets, and Supabase connection string.
- `Makefile`: Commands for running local dev, tests, and clean up.
- `pytest.ini`: Configures pythonpath for smooth test imports.
- `docker-compose.yml`: Multi-service compose orchestrating backend and sample app.
- `backend/requirements.txt`: Python package requirements for the FastAPI backend (including PostgreSQL drivers).
- `backend/Dockerfile`: Container specification for running the backend service.
- `backend/app/main.py`: FastAPI entrypoint, lifespan startup (DB init), and CORS setup.
- `backend/app/config.py`: Centralized settings using `pydantic-settings` (including Supabase settings).
- `backend/app/db.py`: Database engine supporting both Supabase PostgreSQL and SQLite.
- `backend/app/entities/models.py`: SQLModel database tables (`Run`, `Event`, `Incident`, `Approval`, `LedgerEntry`, `RepoConfig`, `RepoEnvVar`, `EC2Instance`).
- `backend/app/entities/__init__.py`: Entity exports.
- `backend/app/routers/agent.py`: Autonomous deployment agent endpoints (`/github/profile`, `/github/connect`, `/github/sync-repos`, `/repos`, `/repos/{id}/env`, `/repos/{id}/env/generate`, `/deploy`, `/stream/{run_id}`).
- `backend/app/routers/health.py`: Healthcheck endpoint `/health`.
- `backend/app/routers/auth.py`: Hackathon demo JWT login endpoint and token dependency.
- `backend/tests/test_health.py`: Unit tests validating `/health` and `/api/auth/login`.
- `frontend/src/app/page.tsx`: Full interactive SaaS dashboard with tabbed workflow, dynamic GitHub PAT connection modal, per-repo .env studio, and real-time SSE streaming.
- `model/proveit_model/agent/loop.py`: Autonomous deployment agent streaming loop with live tools and proof commitment.
- `model/proveit_model/tools/github_tools.py`: Real GitHub REST API tool using `httpx` with zero static fallbacks.
- `model/proveit_model/tools/aws_tools.py`: Real EC2 discovery, SSH ping testing, Docker automated installation, and container deployment.
- `sample_app/*`: Target demo application with `/health` and failure simulations.
- `infra/*`: Pre-validated CloudFormation templates and sandbox Dockerfile.

## Public Signatures & Endpoints
- `GET /health` -> `{"status": "healthy", "service": "proveit-backend", "cloud_mode": str, "llm_provider": str, "environment": str}`
- `GET /api/agent/github/profile` -> Live authenticated profile or unauthenticated status
- `POST /api/agent/github/connect` -> Validates token via GitHub API and syncs all real repositories into database
- `POST /api/agent/github/sync-repos` -> Pulls all repositories for connected account from GitHub REST API
- `GET /api/agent/repos` -> Returns connected repositories from database (empty if none)
- `POST /api/agent/repos` -> Dynamic inspection and registration of any GitHub URL or `owner/repo`
- `DELETE /api/agent/repos/{repo_id}` -> Deletes connected repository and associated environment variables
- `GET /api/agent/repos/{repo_id}/env` -> Returns injected environment variables for repo and target
- `POST /api/agent/repos/{repo_id}/env` -> Saves and persists structured or raw `.env` for repository
- `POST /api/agent/repos/{repo_id}/env/generate` -> Inspects real repo files on GitHub and generates recommended deployment `.env`
- `POST /api/agent/deploy` & `GET /api/agent/stream/{run_id}` -> Executes autonomous deployment to EC2 with injected `.env` and SSE telemetry


- [x] **AGENTIC AI & MULTI-LLM PROVIDER ARCHITECTURE (GEMINI, OPENAI, CLAUDE, GROQ, OLLAMA)**:
  - **Dynamic Multi-LLM Provider Engine**:
    - Created [factory.py](file:///f:/7gen-proveit-innosprint/model/proveit_model/providers/factory.py), [openai_provider.py](file:///f:/7gen-proveit-innosprint/model/proveit_model/providers/openai_provider.py), and [anthropic_provider.py](file:///f:/7gen-proveit-innosprint/model/proveit_model/providers/anthropic_provider.py).
    - Supports dynamic on-the-fly model switching between:
      - **Google Gemini** (`gemini-2.5-flash`, `gemini-1.5-pro`) via `google-genai`
      - **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o1`) via `openai`
      - **Anthropic Claude** (`claude-3-5-sonnet`, `claude-3-5-haiku`)
      - **Groq LPU** (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`)
      - **Ollama / Local LLMs** (`llama3.2`, `deepseek-r1`) via custom base URL (`http://localhost:11434/v1`)
    - API endpoints: `GET /api/agent/llm/status`, `POST /api/agent/llm/configure`, `POST /api/agent/llm/test`.
  - **Agentic AI Repository Stack & Architecture Analyzer**:
    - Created [analyzer_agent.py](file:///f:/7gen-proveit-innosprint/model/proveit_model/agent/analyzer_agent.py).
    - Evaluates repository architecture, evaluates container readiness (0-100% Autonomous Readiness Score), evaluates environment security & blast radius, and provides tailored multi-stage container build specifications.
    - Rendered in frontend UI with dedicated AI badge, executive summary callout, security audit checklist, and `.env` template.
  - **Dual-Mode Conversational & Type 4 Autonomous Deployment Agent**:
    - [loop.py](file:///f:/7gen-proveit-innosprint/model/proveit_model/agent/loop.py) and `POST /api/agent/chat` support conversational DevOps dialogue powered by the active LLM.
    - Full **Type 4 Autonomous ReAct Agent**:
      - Powered by dynamic tool definitions and live [ToolExecutor](file:///f:/7gen-proveit-innosprint/model/proveit_model/agent/tools_registry.py).
      - Registered 10 autonomous tools (`inspect_repository`, `inject_repo_environment`, `list_ec2_instances`, `connect_to_ec2_instance`, `install_docker_on_ec2`, `evaluate_blast_radius`, `deploy_to_ec2_instance`, `verify_ec2_health_probe`, `diagnose_and_heal_anomaly`, `commit_to_proof_ledger`).
      - True ReAct Cycle: The LLM generates reasoning thoughts (`THOUGHT`), autonomously selects tools with dynamic parameters (`TOOL_START`), observes real execution telemetry (`TOOL_RESULT`), self-heals anomalies, and commits immutable cryptographic proof (`RUN_COMPLETE`).
      - Backend-only execution: Zero LLM keys exposed on the frontend; managed strictly via `.env` and backend agents.
      - Graceful rate-limit tolerance: Handles token quota exhaustion autonomously and safely completes all deployment guarantees.

## Known Issues / Decisions
- Supabase connection uses connection pooler `aws-0-ap-northeast-2.pooler.supabase.com:5432` with session mode to ensure reliable IPv4 resolution and compatibility with SQLAlchemy 2.0 / `psycopg`.
- Frontend is strictly UI-only: communicates directly with FastAPI via SSE and REST API without Next.js API route bloat.
