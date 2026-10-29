# 🚀 ProveIt: Complete Feature Specification & Capability Matrix

> **ProveIt** is a production-grade **Type 4 Autonomous Multi-Cloud Deployment, Telephony VoiceOps, and Self-Healing Platform** designed for resilient cloud operations with deterministic policy verification and proof-carrying fixes.

---

## 📑 Feature Index

1. [Autonomous ReAct Agent Core](#1-autonomous-react-agent-core)
2. [Multi-Cloud Orchestration Engine](#2-multi-cloud-orchestration-engine)
3. [Telephony VoiceOps Automation (Sarvam AI)](#3-telephony-voiceops-automation-sarvam-ai)
4. [Dynamic Repository & Architecture Analysis](#4-dynamic-repository--architecture-analysis)
5. [Intelligent Entrypoint & Port Discovery](#5-intelligent-entrypoint--port-discovery)
6. [Per-Repository .env Injection Studio](#6-per-repository-env-injection-studio)
7. [Active Health Verification & Cryptographic Proof Ledger](#7-active-health-verification--cryptographic-proof-ledger)
8. [Autonomous Self-Healing SRE](#8-autonomous-self-healing-sre)
9. [Enterprise Security & Isolated Secret Vault](#9-enterprise-security--isolated-secret-vault)
10. [Modern Next.js 14 Operator Web Console](#10-modern-nextjs-14-operator-web-console)
11. [Multi-Provider Pluggable LLM Engine](#11-multi-provider-pluggable-llm-engine)
12. [Comprehensive Automated Test Suite](#12-comprehensive-automated-test-suite)

---

## 1. Autonomous ReAct Agent Core

ProveIt implements a true **Type 4 Agentic AI** reasoning architecture based on the **ReAct (Reasoning + Action + Observation)** paradigm.

* **Deterministic Thought-Action-Observation Loop**:
  * Emits structured `THOUGHT` reasoning tokens before taking any mutating action.
  * Dynamically selects and parameterizes tools via the `AgentToolsRegistry`.
  * Captures real-time `TOOL_RESULT` telemetry from cloud provider APIs and shell runtimes.
  * Concludes with verifiable `RUN_COMPLETE` statuses carrying cryptographic proofs.
* **10+ Typed Deployment & SRE Tools**:
  * `inspect_repository`: Clones metadata, checks dependencies, analyzes manifest files.
  * `inject_repo_environment`: Synthesizes and injects environment variables into target runtimes.
  * `list_ec2_instances`: Discovers active EC2 instances across AWS regions.
  * `connect_to_ec2_instance`: Performs SSH handshake and validates port 22 connectivity.
  * `install_docker_on_ec2`: Remotely provisions Docker Engine and starts daemons.
  * `evaluate_blast_radius`: Policy engine that computes risk scores before actions execute.
  * `deploy_to_ec2_instance`: Builds and deploys Docker containers to remote EC2 targets.
  * `verify_ec2_health_probe`: Performs active HTTP GET probes against deployed endpoints.
  * `diagnose_and_heal_anomaly`: Pulls logs, diagnoses crashes, and triggers self-healing.
  * `commit_to_proof_ledger`: Creates immutable SHA-256 records on the distributed ledger.
* **Real-Time Streaming Telemetry**:
  * Full deployment execution is streamed to client interfaces via **Server-Sent Events (SSE)** (`POST /api/agent/deploy/stream` and `GET /api/agent/stream/{run_id}`).
  * Live stage progression indicators (Stages 1 through 8) with millisecond-precision timestamps.
* **Conversational Infrastructure Chat**:
  * Interactive DevOps dialogue via `POST /api/agent/chat`.
  * Conversational query capabilities (*"Check the health of my staging cluster"*, *"Roll back the last deployment on Render"*).

---

## 2. Multi-Cloud Orchestration Engine

ProveIt abstracts heterogeneous cloud APIs behind a single, unified execution abstraction.

### A. AWS Cloud Engine (`backend/app/providers/aws_provider.py` & `aws_tools.py`)
* **EC2 Fleet Management**: Discovers, monitors, and manages EC2 instances across supported regions (`us-east-1`, `us-west-2`, `eu-west-1`).
* **Automated SSH Key Management**: Generates dedicated Ed25519/RSA keypairs (`proveit_deploy_key.pem`) and resolves dynamic SSH users (`ubuntu`, `ec2-user`).
* **Remote Docker Engine Lifecycle**: Checks daemon status (`docker info`), auto-installs Docker on vanilla AMIs, and manages container lifecycles.
* **NGINX Reverse Proxy**: Configures dynamic upstream reverse-proxy routes and port mappings.
* **Offline / Simulation Mode**: Supports `CLOUD_MODE=mock` for safe local testing and deterministic demonstrations without incurring cloud costs.

### B. Render Cloud Engine (`backend/app/providers/render_provider.py`)
* **REST API v1 Integration**: Native integration with Render's public REST API for web services and static sites.
* **Auto-Discovery & Classification**: Intelligently identifies whether a repository should be hosted as a Dockerized Web Service, Node runtime, Python service, or Static Jamstack site.
* **Live In-Place Patching**: Performs dynamic updates via `PATCH /v1/services/{id}` and triggers rolling cache-cleared redeploys (`clearCache: "clear"`).
* **Owner Workspace Resolution**: Auto-fetches and selects default Render Owner Workspace IDs.

### C. Vercel Edge Engine (`backend/app/providers/vercel_provider.py`)
* **Vercel REST API v13**: Direct programmatic deployments to the Vercel Edge network.
* **Monorepo Subfolder Detection**: Automatically detects and configures `rootDir` for nested frontend codebases.
* **Custom Domain Aliasing**: Automatically binds deployment URLs and updates alias domains.
* **Status Polling**: Monitors real-time build and deployment states (`BUILDING`, `READY`, `ERROR`).

### D. Railway & Netlify Engines (`railway_provider.py`, `netlify_provider.py`)
* **Railway GraphQL Engine**: Deploys multi-language container buildpacks using Railway's project API.
* **Netlify Jamstack Engine**: Triggers atomic static builds and deploys frontends with edge CDN caching.

---

## 3. Telephony VoiceOps Automation (Sarvam AI)

ProveIt breaks out of the web browser, allowing on-call engineers to manage deployments, diagnose failures, and trigger rollbacks over normal telephone calls.

* **State-of-the-Art Indian Language & Accent Speech AI**:
  * **Speech-to-Text (STT)**: Powered by Sarvam AI `saaras:v1` with high-accuracy comprehension for English and regional Indian languages.
  * **Text-to-Speech (TTS)**: Powered by Sarvam AI `bulbul:v1` using the ultra-low-latency `meera` voice model.
* **Carrier Inbound Webhook**:
  * Webhook listener at `POST /api/voice/webhook` handling carrier telephony events.
* **Voice Security & 4-Digit PIN Authentication**:
  * Telephony PIN verification challenge before any mutating infrastructure operation can execute.
  * Validates session security and isolates permissions.
* **Fuzzy Repository & Project Matching**:
  * Natural language understanding using sequence matching: handles colloquial phrases like *"Deploy my birthday celebration app to Render"* and resolves it to `mallampati-sumanth/birthday-app`.
* **Voice Project Lifecycle Operations**:
  * Check deployment health and last deployment status over voice.
  * Trigger immediate service rollback during P0 incidents without opening a laptop.
  * Clean up and delete voice-provisioned projects (`DELETE /api/voice/projects/{id}`).

---

## 4. Dynamic Repository & Architecture Analysis

Eliminates manual manifest writing and provides instant insights into unknown codebases.

* **100% Dynamic GitHub API Integration**:
  * Connects securely using GitHub Personal Access Tokens (PAT).
  * Syncs public and private repositories in real-time.
  * Zero hardcoded repository lists or mock repos.
* **Manifest & Framework Inspection**:
  * Scans root and nested directories for `package.json`, `requirements.txt`, `Dockerfile`, `go.mod`, `Cargo.toml`.
  * Detects frameworks: Next.js, React, FastAPI, Flask, Express, Django, static HTML.
* **Autonomous Readiness Score (0-100%)**:
  * Evaluates repository readiness across containerization, configuration, health endpoints, and security posture.
* **Dynamic Dockerfile Synthesis**:
  * Generates optimal, multi-stage, security-hardened Dockerfiles when none exist in the repository.
* **Security & Vulnerability Audit Checklist**:
  * Flags exposed credentials, missing `.dockerignore` files, and unpinned dependencies.

---

## 5. Intelligent Entrypoint & Port Discovery

Solves one of the most frequent Jamstack and static web deployment bugs: **broken directory listings (`Directory listing for /`)**.

* **Smart HTML Entrypoint Aliasing**:
  * Deep scans root and common client folders (`public/`, `dist/`, `build/`, `client/`).
  * Finds standalone entrypoints such as `task1.html`, `main.html`, `home.html`, or any single `*.html` file.
  * Aliases the discovered file to `index.html` at deploy time, preventing default folder directory listings.
* **Single Page Application (SPA) Fallback Routing**:
  * Automatically configures static web server rewrite rules to route 404 paths to `index.html`.
* **Dynamic Runtime Port Binding**:
  * Detects port declarations from source code (`PORT` env, `3000`, `8000`, `5000`, `8080`) and wires container exposure accordingly.

---

## 6. Per-Repository .env Injection Studio

Prevents deployment failures caused by missing environment variables.

* **Isolated Environment Storage**:
  * Environment variables stored per repository and target environment via `RepoEnvVar` SQLModel.
* **Dual Editing Modes**:
  * **Structured Key-Value Table**: Type-safe inputs with quick toggles.
  * **Raw `.env` Code Editor**: Copy-paste syntax-highlighted `.env` files with inline validation.
* **Secret Value Masking**:
  * Sensitive variables (`SECRET_KEY`, `PASSWORD`, `API_KEY`) masked by default with toggleable visibility.
* **Automated `.env` Recommendation**:
  * Analyzes `.env.example`, `.env.template`, and source code variable references (`process.env`, `os.getenv`).
  * Suggests recommended environment configurations with one-click injection (`POST /api/agent/repos/{id}/env/generate`).

---

## 7. Active Health Verification & Cryptographic Proof Ledger

Traditional CI/CD tools stop when a container exits status 0. ProveIt proves the application is truly alive and operational.

* **Active HTTP 200 Prober**:
  * Probes the live deployed URL over public networks.
  * Records HTTP status codes, latency in milliseconds, and response bodies.
  * Configurable retry backoff (`HEALTH_CHECK_MAX_RETRIES`, `HEALTH_CHECK_INTERVAL_SECONDS`).
* **Cryptographic SHA-256 Ledgering**:
  * Each successful deployment generates a mathematical proof seal:
    $$\text{Proof Seal} = \text{SHA-256}(\text{provider} \parallel \text{deployment\_id} \parallel \text{live\_url} \parallel \text{commit\_sha})$$
* **Tamper-Evident Hash Chaining**:
  * Ledger entries link cryptographically to the previous entry hash, forming an immutable audit trail.
* **SOC2 & Compliance Export**:
  * Generates exportable, verifiable proof records proving deployment authenticity and compliance.

---

## 8. Autonomous Self-Healing SRE

When deployments fail or crash loops occur, ProveIt diagnoses and recovers automatically.

* **Real-Time Log Ingestion**:
  * Fetches the latest 200 lines of container stderr/stdout and provider build logs.
* **LLM-Powered Root Cause Analysis (RCA)**:
  * Categorizes errors into missing dependencies, missing `.env` variables, port conflicts, or syntax errors.
* **Sub-15-Second Automated Remediation**:
  * Automatically triggers container restarts.
  * Reverts cloud target services to the last known healthy deployment commit.
  * Re-probes the health endpoint to guarantee recovery.

---

## 9. Enterprise Security & Isolated Secret Vault

* **Per-User Credential Vault**:
  * Cloud provider keys (`RENDER_API_KEY`, `VERCEL_TOKEN`, `AWS_ACCESS_KEY_ID`, `SARVAM_API_KEY`) are encrypted and isolated per user account.
  * No cross-tenant credential leakage.
* **Zero Hardcoded Secrets**:
  * Enforced via automated tests and pre-commit checks.
* **Salted SHA-256 & JWT Authentication**:
  * Standardized secure authentication for API routes.
* **CORS & Edge Protection**:
  * Strict CORS allowlist protects backend APIs against cross-origin attacks.

---

## 10. Modern Next.js 14 Operator Web Console

Built with Next.js 14 (App Router), React 18, Tailwind CSS, and Lucide Icons.

* **Interactive Tabs**:
  * **Repositories**: GitHub PAT integration, repo syncing, commit exploration.
  * **Repo .env Injector**: Structured KV and raw `.env` editor with masking and auto-generation.
  * **EC2 Fleet**: Real-time AWS EC2 node status, SSH checks, Docker daemon status, container list.
  * **Pipeline Tracker**: Live 8-stage visual pipeline tracker powered by real-time SSE.
  * **Agent Chat Console**: Dual-mode conversational and autonomous DevOps chat with tool trace rendering.
  * **VoiceOps & Voice Automation**: Telephony control panel, live call logs, PIN authentication, project management.
  * **Settings & Vault**: Masked credential management for AWS, Render, Vercel, Sarvam AI, and GitHub.
  * **Activity & Audit**: Complete immutable ledger of all deployments, status codes, and cryptographic seals.
* **Modal Wizards**:
  * `DeploymentWizardModal`: Multi-cloud target selection and configuration wizard.
  * `EC2ProvisionWizardModal`: Automated EC2 instance launcher.
  * `GitHubConnectModal`: Secure Personal Access Token connector.

---

## 11. Multi-Provider Pluggable LLM Engine

ProveIt supports dynamic switching between major LLM providers:

| Provider | Supported Models | Integration Mechanism |
| :--- | :--- | :--- |
| **Google Gemini** | `gemini-2.5-flash`, `gemini-1.5-pro` | Official `google-genai` SDK |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `o1` | Official `openai` SDK |
| **Anthropic Claude** | `claude-3-5-sonnet`, `claude-3-5-haiku` | Anthropic Messages API |
| **Groq LPU** | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768` | Ultra-fast low-latency inference |
| **Ollama / Local** | `llama3.2`, `deepseek-r1` | Local OpenAI-compatible endpoint |

---

## 12. Comprehensive Automated Test Suite

* **Pytest Backend Suite (25 Tests)**:
  * Agent loop execution and ReAct streaming.
  * AWS EC2 provisioning and SSH handshake.
  * Render provider dynamic deployment and HTML aliasing.
  * Vercel provider deployment and subfolder root detection.
  * Per-user credential isolation and security audits.
  * VoiceOps webhook handling and Sarvam AI integration.
* **Frontend Strict TypeScript Compilation**:
  * Clean Next.js 14 Turbopack build with zero TypeScript or linting errors.

