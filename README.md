# ProveIt: Autonomous AWS Deployment & Self-Healing Agent
> *"Do not just suggest the fix. Prove it."*

**Team 7TH GEN, KL University — Agentic AI Track 01**  
Built for AWS InnoSprint with deterministic policy verification and proof-carrying fixes.

---

## 🚀 Streamlined 3-Step Primary Workflow

The platform provides a simple, clean, and intuitive path from authentication to autonomous AWS cloud deployment:

```
[ Step 1: Authenticate ] ──> [ Step 2: Connect GitHub ] ──> [ Step 3: Prompt & Deploy to AWS ]
     (Admin / Demo)             (OAuth / Personal Token)          (Type 4 Autonomous Agent)
```

1. **Step 1: Authenticate (Mandatory App Gate)**:
   - **Register with Email**: Create a new account with email address, username, full name, and password via `POST /api/auth/register`. Passwords are encrypted using unique salted SHA-256 hashes.
   - **Sign In with Email or Username**: Authenticate using email or username with password via `POST /api/auth/login`.
   - **GitHub OAuth & Access Token**: Seamless sign-in via GitHub OAuth or personal access tokens via `POST /api/auth/github`. Automatically syncs user profile and grants deployment access.
   - **1-Click Demo Admin**: Instant evaluator sign-in (`admin` / `proveit_demo_secret_2026`).
   - **Application Context Guard**: `AuthContext` wraps the entire platform; unauthenticated visitors cannot access the console, tools, or deployment stations.
2. **Step 2: Connect GitHub**:
   - Connect GitHub account via personal access token or OAuth.
   - Automatically discovers and dynamically syncs user repositories with star counts, languages, and branches.
3. **Step 3: Prompt & Deploy to AWS** *(Main Hero Progress)*:
   - Select target repository and target AWS EC2 instance.
   - Enter a natural language prompt (e.g. *"Deploy pallets/flask to EC2 in production mode"*), or click a 1-click prompt suggestion chip.
   - The **Type 4 Autonomous ReAct Agent** autonomously executes:
     - 🧠 **Autonomous AI Reasoning**: Real-time thoughts streamed via Server-Sent Events (SSE).
     - 🔍 **Inspect Repository**: Reads manifests, Dockerfile, ports, and runtime dependencies.
     - ⚙️ **Inject .env**: Reads or securely provisions environment variables into the container.
     - 🖥️ **Host Connectivity**: Verifies SSH/SSM reachability to the target EC2 host.
     - 🐳 **Docker Daemon Verification**: Ensures Docker Engine is running and ready.
     - 🛡️ **Blast Radius Policy Gate**: Evaluates environment blast radius against safety policies.
     - 🚀 **Deploy Container**: Pulls/builds and runs containerized workloads on EC2.
     - 🩺 **Health Check Verification**: Probes HTTP endpoints for live 200 OK status.
     - 📜 **Cryptographic Proof Ledger**: Commits tamper-evident SHA-256 hash-chained proof records to Supabase PostgreSQL.

---

## 🛠️ Advanced Secondary Cases & Capabilities

Directly accessible via hero buttons and the left navigation sidebar:

### 1. 🔍 Repository Manifest & Tech Stack Analyzer (`/analyze`)
- Powered by `RepoAnalyzerAgent` and active backend LLM (Groq Qwen 2.5 / OpenAI / Gemini).
- Ingests public or private GitHub repositories.
- Evaluates **0–100% Autonomous Deployment Readiness Score**.
- Automatically generates:
  - Hardened multi-stage production `Dockerfile`.
  - Recommended production `.env` template.
  - Security audit and exposed port detection.

### 2. ⚙️ Per-Repository .env Injection Studio (`/repoenv`)
- Isolated environment variable configuration per repository and deployment environment (`production`, `staging`, `development`).
- Features secret value masking (`••••••••`), raw `.env` parser, key-value editor, and direct AWS container injection.

### 3. 🖥️ AWS EC2 Cloud Fleet Management (`/ec2`)
- Real-time inventory of EC2 instances with public IPs, instance types, AWS regions, and states (`running`, `stopped`).
- Live SSH/SSM latency ping check and Docker Engine daemon telemetry.
- 1-click Docker installation and container lifecycle control.

### 4. 📜 Cryptographic Proof Ledger (`/ledger`)
- Tamper-evident, hash-chained ledger entries stored in Supabase PostgreSQL.
- Computes SHA-256 verification hashes across repository, commit SHA, host IP, environment, and verification timestamp.
- 1-click cryptographic integrity verification.

### 5. ☁️ AWS Cloud Infrastructure Topology (`/infra`)
- Visual live topology mapping VPC, Subnets, EC2 Instances, Docker Containers, and CloudWatch telemetry.

---

## 🏃 Running the Application

### Local Development

#### 1. Backend (FastAPI + SQLModel + Type 4 Autonomous Agent)
```bash
# In project root
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health Probe: `http://localhost:8000/health`

#### 2. Frontend (Next.js 14 LTS)
```bash
# In project root (via npm script proxy)
npm run dev

# Or in frontend/ subfolder
cd frontend && npm run dev
```
- Web Application: `http://localhost:3000`

---

## ☁️ Production Cloud Deployment Guide

### 1. Frontend on Vercel (Dual-Path Resilient Setup)
ProveIt supports both common Vercel deployment methods out of the box:

- **Path A: Default Root Import (`.`)**:
  - Connect your GitHub repository to Vercel with default settings (Root Directory = `.`).
  - Vercel automatically detects root `vercel.json` and runs the proxy build commands.
- **Path B: Subfolder Import (`frontend`)**:
  - In Vercel Project Settings, set **Root Directory** to `frontend`.
  - Vercel automatically uses `frontend/vercel.json` with the Next.js framework preset.

**Environment Variables for Vercel Project Settings**:
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Live HTTPS URL of your deployed FastAPI backend | `https://api.proveit.cloud` |
| `NEXT_PUBLIC_API_URL` | Alternative alias for backend API | `https://api.proveit.cloud` |

> **Mixed Content Note**: In production, Vercel serves the frontend over HTTPS (`https://*.vercel.app`). `next.config.js` includes server-side `/api/:path*` rewrites, ensuring all API traffic routes securely without browser Mixed Content blocking.

### 2. Backend on AWS EC2 / Render / Railway (Docker Container)
The FastAPI backend requires persistent disk access for SQLite, local Docker Engine control, and long-running Server-Sent Events (SSE) connections. It must be hosted on a persistent VM or container service:

```bash
# Build and run the production backend container
docker build -t proveit-backend -f backend/Dockerfile .
docker run -d --name proveit-backend -p 8000:8000 -v /var/run/docker.sock:/var/run/docker.sock proveit-backend
```

**Required Backend Environment Variables**:
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (e.g. `us-east-1`)
- `JWT_SECRET` (super_secret_jwt_key_...)
- `GITHUB_TOKEN` (for repository manifest cloning)
- `GEMINI_API_KEY` or `OPENAI_API_KEY` / `GROQ_API_KEY`

---

## 🔒 Security Architecture
- **Backend-Only LLM Credentials**: API keys (`GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) and AWS credentials remain strictly on the backend server.
- **Deterministic Blast Radius Guard**: Hard-coded safety policies evaluate blast radius before any deployment command executes on AWS hosts.
