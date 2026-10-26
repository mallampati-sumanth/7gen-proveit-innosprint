# ProveIt Progress Log

## Finished Phases
- [x] **PHASE 0: Scaffold**: Complete repo layout (`frontend/`, `backend/`, `infra/`, `model/`, `sample_app/`), SQLModel SQLite + Supabase (PostgreSQL) dual support, config with `pydantic-settings`, `/health` & `/api/auth/login` endpoints, `pytest.ini`, `docker-compose.yml`, Makefile, and sample Flask target app.
- [x] **SUPABASE & NEXT.JS SAAS FRONTEND**:
  - Upgraded database engine in `backend/app/db.py` to support Supabase PostgreSQL connections via `DATABASE_URL` and `asyncpg`/`psycopg2-binary`.
  - Built high-aesthetic Next.js 14 App Router SaaS dashboard with glassmorphism, tailored dark theme, and rich micro-interactions.
  - Implemented all key UI modules:
    - **ChatBox**: Natural-language deployment command console with pre-validated quick prompts.
    - **EvidenceTimeline & EventCard**: Live SSE streaming event cards with `PolicyBadge` indicators.
    - **ChaosPanel**: 6 live failure scenario buttons (Wrong Port, Missing Env, Broken Build, Bad Health Path, OOM, Gateway 502).
    - **ProofBundleView**: Visual inspection of Proof-Carrying Fixes, failure hypotheses, throwaway sandbox results, and typed diffs.
    - **ApprovalsPanel**: Human-in-the-loop gatekeeper when Blast Radius >= 50.
    - **LedgerView**: Tamper-evident SHA-256 hash-chained audit ledger with live chain verification.
    - **BenchmarkView**: Empirical comparison tables and KPIs against Plain LLM (Fix Success Rate, MTTR, Unsafe Proposals).
    - **API Client**: Strict hand-written fetch wrapper in `frontend/src/lib/api.ts` with demo JWT auth.

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
- `backend/app/entities/models.py`: SQLModel database tables (`Run`, `Event`, `Incident`, `Approval`, `LedgerEntry`, `BenchmarkResult`).
- `backend/app/entities/__init__.py`: Entity exports.
- `backend/app/routers/health.py`: Healthcheck endpoint `/health`.
- `backend/app/routers/auth.py`: Hackathon demo JWT login endpoint and token dependency.
- `backend/tests/test_health.py`: Unit tests validating `/health` and `/api/auth/login`.
- `frontend/package.json`: Next.js 14 App Router UI setup with Supabase JS client and Lucide icons.
- `frontend/tsconfig.json`: TypeScript configuration.
- `frontend/next.config.js`: Next.js config.
- `frontend/tailwind.config.js`: Premium dark SaaS theme palette.
- `frontend/postcss.config.js`: PostCSS config.
- `frontend/src/app/globals.css`: Base styles and glassmorphism utilities.
- `frontend/src/app/layout.tsx`: Root Next.js layout.
- `frontend/src/app/page.tsx`: Full interactive SaaS dashboard with tabbed workflow.
- `frontend/src/lib/types.ts`: TypeScript domain models.
- `frontend/src/lib/api.ts`: Hand-written API client wrapper with JWT support.
- `frontend/src/lib/utils.ts`: Styling and formatting helpers.
- `frontend/src/hooks/useSSE.ts`: Live SSE streaming hook.
- `frontend/src/components/chat/ChatBox.tsx`: Command chat input.
- `frontend/src/components/timeline/EvidenceTimeline.tsx`: Live timeline.
- `frontend/src/components/timeline/EventCard.tsx`: Individual timeline event card with expandable JSON.
- `frontend/src/components/timeline/PolicyBadge.tsx`: Visual policy verdict status badge.
- `frontend/src/components/chaos/ChaosPanel.tsx`: 6 live failure injection triggers.
- `frontend/src/components/incidents/ProofBundleView.tsx`: Proof-Carrying Fix artifact inspector.
- `frontend/src/components/approvals/ApprovalsPanel.tsx`: Human gatekeeper approvals UI.
- `frontend/src/components/ledger/LedgerView.tsx`: Hash-chained audit ledger with verification button.
- `frontend/src/components/benchmark/BenchmarkView.tsx`: Head-to-head empirical benchmark dashboard.
- `model/pyproject.toml`: Build configuration for the isolated `proveit-model` package.
- `model/proveit_model/*`: Isolated model namespaces (no cloud/docker imports).
- `sample_app/*`: Target demo application with `/health` and failure simulations.
- `infra/*`: Pre-validated CloudFormation templates and sandbox Dockerfile.

## Public Signatures & Endpoints
- `GET /health` -> `{"status": "healthy", "service": "proveit-backend", "cloud_mode": str, "llm_provider": str, "environment": str}`
- `POST /api/auth/login` (`LoginRequest`) -> `TokenResponse(access_token: str, token_type: str, expires_in_minutes: int)`
- `backend.app.db.init_db()` -> None
- `backend.app.db.get_session()` -> Generator[Session]

## Known Issues / Decisions
- Dual DB support: defaults to SQLite for zero-setup local dev, automatically switches to Supabase PostgreSQL when `DATABASE_URL=postgresql://...` is supplied in `.env`.
- Frontend is strictly UI-only: communicates directly with FastAPI via [frontend/src/lib/api.ts](file:///d:/Personal_Projects/PROVEIT/frontend/src/lib/api.ts) and SSE without Next.js API route bloat.
