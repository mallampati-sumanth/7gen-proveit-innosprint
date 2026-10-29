# 🛠️ ProveIt: Complete Installation & Setup Guide

This guide walks you through setting up and running the **ProveIt** platform locally or in production across **Windows**, **Linux**, and **macOS**.

---

## 📑 Table of Contents

1. [System Prerequisites](#1-system-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Environment Variables Configuration](#3-environment-variables-configuration)
4. [Backend Setup (FastAPI & Python)](#4-backend-setup-fastapi--python)
5. [Frontend Setup (Next.js 14 & Node.js)](#5-frontend-setup-nextjs-14--nodejs)
6. [Docker Compose Full-Stack Setup](#6-docker-compose-full-stack-setup)
7. [Database Setup (SQLite vs. Supabase PostgreSQL)](#7-database-setup-sqlite-vs-supabase-postgresql)
8. [Connecting External Services & Cloud Providers](#8-connecting-external-services--cloud-providers)
9. [Verification & Running Tests](#9-verification--running-tests)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. System Prerequisites

Ensure you have the following installed on your machine:

| Component | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Python** | 3.11+ | 3.11 or 3.12 | `python --version` or `python3 --version` |
| **Node.js** | 18.17+ | 20.x LTS | `node --version` |
| **npm** | 9.x+ | 10.x+ | `npm --version` |
| **Git** | 2.30+ | Latest | `git --version` |
| **Docker Engine** | 24.0+ *(Optional for non-container runs)* | Latest Docker Desktop | `docker --version` |
| **Docker Compose**| 2.20+ *(Optional)* | Latest | `docker compose version` |

> [!NOTE]
> On **Windows**, we recommend using PowerShell (Run as Administrator if installing software) or WSL 2. Ensure Python and Node.js are added to your system `PATH`.

---

## 2. Repository Setup

Clone the repository to your local machine and navigate into the root directory:

```bash
git clone https://github.com/mallampati-sumanth/7gen-proveit-innosprint.git
cd 7gen-proveit-innosprint
```

Directory structure overview:
```
7gen-proveit-innosprint/
├── backend/          # FastAPI ASGI application, cloud providers, and test suite
├── frontend/         # Next.js 14 Web Console application
├── model/            # Autonomous ReAct agent core, tools, and LLM factory
├── infra/            # CloudFormation templates and deployment infrastructure
├── sample_app/       # Demo target application for deployment tests
├── docker-compose.yml# Multi-container orchestration
└── .env.example      # Master environment variables template
```

---

## 3. Environment Variables Configuration

ProveIt includes a comprehensive `.env.example` file. Create your local `.env` file in the root directory:

```bash
# On Linux / macOS / Git Bash
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

### Essential Configuration Variables

Open `.env` in your editor and configure the essential keys:

```env
# ==============================================================================
# 1. CORE SERVER & RUNTIME
# ==============================================================================
ENVIRONMENT=development
LOG_LEVEL=INFO
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# ==============================================================================
# 2. DATABASE & AUTHENTICATION
# ==============================================================================
# Local zero-configuration SQLite (default):
DATABASE_URL=sqlite:///./proveit.db

# JWT Secret (generate a secure 32+ character string):
JWT_SECRET=super_secret_jwt_key_proveit_hackathon_change_in_prod
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=120

# Demo Administrator Credentials (used for quick 1-click login):
DEMO_USERNAME=admin
DEMO_PASSWORD=proveit_demo_secret_2026

# ==============================================================================
# 3. LLM INTELLIGENCE CORE (At least one key is recommended)
# ==============================================================================
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Optional alternative providers:
# GROQ_API_KEY=your_groq_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# ==============================================================================
# 4. CLOUD PROVIDERS & REPOSITORIES (Optional for basic local UI testing)
# ==============================================================================
# Execution mode: "mock" (offline simulation) or "aws" (live EC2 provisioning)
CLOUD_MODE=mock

# GitHub Personal Access Token (for dynamic repo sync and manifest analysis):
GITHUB_TOKEN=ghp_your_personal_access_token_here

# Multi-Cloud deployment targets (configured in .env or via Settings UI):
# RENDER_API_KEY=rnd_your_render_api_key_here
# VERCEL_TOKEN=your_vercel_token_here
# AWS_ACCESS_KEY_ID=your_aws_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret
# AWS_REGION=us-east-1

# Telephony VoiceOps (powered by Sarvam AI):
# SARVAM_API_KEY=your_sarvam_api_key_here
```

---

## 4. Backend Setup (FastAPI & Python)

The backend is built with **FastAPI**, **SQLModel**, and **Pydantic v2**.

### Step 1: Create a Python Virtual Environment

```bash
# On Windows (PowerShell)
python -m venv venv
.\venv\Scripts\activate

# On Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

> [!TIP]
> If you are working on the autonomous agent model tools, install the model package in editable mode:
> ```bash
> pip install -e model
> ```

### Step 3: Run the FastAPI Server

```bash
# Run using uvicorn from the project root
uvicorn backend.app.main:app --reload --port 8000
```

* **Backend Healthcheck:** [http://localhost:8000/health](http://localhost:8000/health) or [http://localhost:8000/api/health](http://localhost:8000/api/health)
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 5. Frontend Setup (Next.js 14 & Node.js)

The frontend is a modern **Next.js 14** application with App Router, Turbopack, and Tailwind CSS.

### Step 1: Navigate to the Frontend Directory

```bash
cd frontend
```

### Step 2: Install Node Dependencies

```bash
npm install
```

### Step 3: Configure Frontend Environment (Optional)

Create a `frontend/.env.local` if your backend is running on a custom port or remote domain:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Step 4: Start the Development Server

```bash
npm run dev
```

* **Frontend Console URL:** [http://localhost:3000](http://localhost:3000)
* Open your browser and navigate to `http://localhost:3000`.
* Log in using the **1-Click Demo Login** or create a new account.

### Step 5: Building for Production (Verification)

To verify the production build:

```bash
npm run build
npm run start
```

---

## 6. Docker Compose Full-Stack Setup

If you prefer running the entire stack in containers with one command:

```bash
# From the project root
docker compose up --build -d
```

To view logs:
```bash
docker compose logs -f
```

To stop all containers:
```bash
docker compose down
```

Services exposed:
- **ProveIt Backend:** `http://localhost:8000`
- **Sample Target App:** `http://localhost:3000` (used for health verification testing)

---

## 7. Database Setup (SQLite vs. Supabase PostgreSQL)

ProveIt natively supports both **SQLite** (for fast zero-dependency local runs) and **Supabase PostgreSQL** (for production deployments).

### Option A: Local SQLite (Default)
No additional installation is needed. By setting:
```env
DATABASE_URL=sqlite:///./proveit.db
```
The database and all SQLModel tables are initialized automatically upon starting the backend.

### Option B: Supabase / PostgreSQL (Production)
1. Create a project at [Supabase](https://supabase.com).
2. Retrieve your connection string from **Project Settings > Database > Connection string (Session Mode)**.
3. Update `.env`:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```
4. Start the backend; tables (`users`, `deployments`, `ledger_entries`, `repo_configs`, `repo_env_vars`, `ec2_instances`) will be created automatically.

---

## 8. Connecting External Services & Cloud Providers

You can configure cloud credentials either via `.env` or interactively in the **Settings Panel** within the web console:

### 1. GitHub Personal Access Token (PAT)
- Go to [GitHub Tokens (Classic)](https://github.com/settings/tokens).
- Generate a token with scopes: `repo` (Full control) and `read:org`.
- In the ProveIt web console, click **Connect GitHub** and paste your token. All your repositories will synchronize automatically.

### 2. Render Cloud
- Retrieve your API Key from [Render Account Settings](https://dashboard.render.com/u/settings).
- Add it to the Settings panel under **Render API Key** (`rnd_...`).

### 3. Vercel
- Retrieve your Personal Access Token from [Vercel Tokens](https://vercel.com/account/tokens).
- Add it to the Settings panel under **Vercel Token**.

### 4. AWS IAM Credentials
- Create an IAM User with permissions for EC2 (`AmazonEC2FullAccess`).
- Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION` (e.g. `us-east-1`).

### 5. Sarvam AI (Telephony VoiceOps)
- Obtain an API key from [Sarvam AI](https://www.sarvam.ai/).
- Enter it under **Sarvam AI API Key** in Settings or in `.env`.
- Configure your 4-digit Voice PIN to authorize incoming telephony actions.

---

## 9. Verification & Running Tests

ProveIt includes comprehensive automated test suites to verify system integrity before deploying to production:

### Run Backend Pytest Suite (25 Tests)

```bash
# With the virtual environment active:
pytest backend/tests -v
```

Expected output:
```
backend/tests/test_agent_loop.py ................. Passed
backend/tests/test_render_provider.py ............ Passed
backend/tests/test_aws_provisioner.py ............ Passed
backend/tests/test_cors_vercel.py ................ Passed
backend/tests/test_p0_security_fixes.py .......... Passed
backend/tests/test_voice_automation_tasks.py ..... Passed
============================== 25 passed in 37.86s ==============================
```

### Verify System Health Probes

```bash
# Probe backend health
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "proveit-backend", ...}

curl http://localhost:8000/api/health
# Expected: {"status": "healthy", "service": "proveit-api", ...}
```

---

## 10. Troubleshooting & FAQs

### Q1: `ModuleNotFoundError: No module named 'backend'` or `model`
**Solution:** Ensure you run commands from the project root directory, or ensure `pytest.ini` is present with `pythonpath = .`. When running uvicorn, run:
```bash
uvicorn backend.app.main:app --reload --port 8000
```

### Q2: Port 8000 or 3000 is already in use
**Solution:**
- On Windows: Run `netstat -ano | findstr :8000` to find the process ID, then terminate with `taskkill /PID <PID> /F`.
- On Linux/macOS: Run `lsof -i :8000` and `kill -9 <PID>`.
- Alternatively, launch uvicorn on another port: `uvicorn backend.app.main:app --reload --port 8001` and update `NEXT_PUBLIC_API_URL`.

### Q3: CORS errors in browser console
**Solution:** Check `CORS_ORIGINS` in your `.env`. By default, it allows `http://localhost:3000` and `http://127.0.0.1:3000`. If running frontend on another origin, add it to the array.

### Q4: GitHub Rate Limit exceeded
**Solution:** Provide a valid GitHub Personal Access Token in `.env` (`GITHUB_TOKEN`) or via the UI. Unauthenticated requests to GitHub are strictly limited to 60 requests/hour.

### Q5: Docker daemon connection errors on Windows
**Solution:** If using Docker for local EC2 simulation or container builds, make sure **Docker Desktop** is running and "Expose daemon on tcp://localhost:2375 without TLS" is configured if required by your environment.

---

### Need Further Assistance?
Refer to [FEATURE_LIST.md](FEATURE_LIST.md) for full architectural details, or consult the project issue tracker.

