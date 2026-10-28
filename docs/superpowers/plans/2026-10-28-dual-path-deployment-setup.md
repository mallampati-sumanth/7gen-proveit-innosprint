# Dual-Path Resilient Deployment Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure dual-path production deployment readiness for ProveIt, allowing automated deployment from both the repository root (`.`) and subfolder (`frontend`), locking Next.js at `^14.2.25` LTS, adding `.npmrc` CI configs, enabling Next.js API rewrites, and permitting `*.vercel.app` in backend CORS.

**Architecture:** Implement dual deployment descriptors (`vercel.json` at root and in `frontend/`), proxy npm scripts at root pointing to `frontend/`, configure Next.js reverse-proxy rewrites for backend API calls, and update FastAPI CORS regular expression to allow any preview or production `*.vercel.app` ingress.

**Tech Stack:** Next.js 14 (`^14.2.25`), React 18, TypeScript 5, Vercel Build Engine, FastAPI, Python 3.13, Pytest.

**Spec:** User prompt specifying Approach 1: Dual-Path Resilient Setup (Root & Frontend vercel.json, npm script proxies, Next.js ^14.2.25 lock, .npmrc, and backend CORS regex for *.vercel.app).

---

## Global Constraints

- **Next.js Version Floor**: Strictly locked at `^14.2.25` in `frontend/package.json`.
- **Branch Safety**: Never touch `mvp-1` branch in git. Keep all work on `main`.
- **No Token Leaks**: Root `package.json` and all config files must have 0 plain-text credentials.
- **Portability**: All CI scripts and `.npmrc` files must work on Windows, macOS, and Linux without OS-specific paths.
- **Backward Compatibility**: Local development on `localhost:3000` and `localhost:8000` must remain 100% operational.

## Review Focus

1. Root Vercel import (`.`): Running `npm run build` from the repo root builds the Next.js app in `frontend/`.
2. Subfolder Vercel import (`frontend`): Setting Vercel Root Directory to `frontend` builds natively without script proxies.
3. CORS Ingress: Outbound fetch requests from any `https://<any-preview>.vercel.app` must receive valid CORS headers from FastAPI.
4. Next.js API Rewrites: Reverse proxying `/api/:path*` via `next.config.js` forwards to the backend URL when configured.
5. Node Package Resolution: `.npmrc` `legacy-peer-deps=true` prevents build failures across varied npm versions in CI.

---

### Task 1: Lock Next.js to Stable 14.x LTS (`^14.2.25`) & Add `.npmrc`

**Files:**
- Modify: `frontend/package.json`
- Create: `.npmrc`
- Create: `frontend/.npmrc`

**Interfaces:**
- Produces: Stable Next.js 14 dependency declaration and non-blocking npm peer dependency resolution in CI.

- [ ] **Step 1: Write `.npmrc` files in root and `frontend/`**

Create `.npmrc` and `frontend/.npmrc` with:
```ini
legacy-peer-deps=true
engine-strict=false
fund=false
audit=false
```

- [ ] **Step 2: Update `frontend/package.json` to lock Next.js to `^14.2.25`**

Update `dependencies.next` in `frontend/package.json`:
```json
"dependencies": {
  "next": "^14.2.25",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  ...
}
```

- [ ] **Step 3: Run npm install in `frontend/` to sync lockfile**

Run: `npm install --prefix frontend --legacy-peer-deps`
Expected: Success, installs Next.js 14.2.25.

- [ ] **Step 4: Verify TypeScript compilation in `frontend/`**

Run: `npx tsc --noEmit` in `frontend/`
Expected: 0 errors.

---

### Task 2: Configure Root NPM Script Proxies & Root `vercel.json`

**Files:**
- Modify: `package.json`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `frontend/` scripts (`dev`, `build`, `start`, `lint`).
- Produces: Root-level npm scripts that delegate to `frontend/`, allowing Vercel and CI to run `npm run build` from the repo root `.`.

- [ ] **Step 1: Update root `package.json` with script proxies**

In `package.json`, update `scripts`:
```json
"scripts": {
  "dev": "npm --prefix frontend run dev",
  "build": "npm --prefix frontend run build",
  "start": "npm --prefix frontend run start",
  "lint": "npm --prefix frontend run lint",
  "test": "pytest backend/tests"
}
```

- [ ] **Step 2: Create root `vercel.json` for root-level deployment**

Create `vercel.json` at root:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs"
}
```

- [ ] **Step 3: Test building from the repository root**

Run: `npm run build` from the repo root
Expected: Compiles Next.js application in `frontend/.next` with exit code 0.

---

### Task 3: Configure `frontend/vercel.json` & Next.js API Rewrites

**Files:**
- Create: `frontend/vercel.json`
- Modify: `frontend/next.config.js`

**Interfaces:**
- Produces: Subfolder Vercel deployment support and `/api/:path*` reverse-proxy routing.

- [ ] **Step 1: Create `frontend/vercel.json`**

Create `frontend/vercel.json`:
```json
{
  "framework": "nextjs"
}
```

- [ ] **Step 2: Update `frontend/next.config.js` with API rewrites**

In `frontend/next.config.js`, configure `rewrites`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 3: Verify build in `frontend/` directory**

Run: `npm run build` inside `frontend/`
Expected: Next.js build succeeds with exit code 0.

---

### Task 4: Update Backend CORS to Support `*.vercel.app` & Verify With Pytest

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/config.py`
- Create: `backend/tests/test_cors_vercel.py`

**Interfaces:**
- Produces: Ingress access for Vercel preview and production domains on all API routes.

- [ ] **Step 1: Write the failing CORS test in `backend/tests/test_cors_vercel.py`**

```python
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_cors_vercel_preview_and_production_domains():
    origins = [
        "https://proveit-frontend.vercel.app",
        "https://proveit-frontend-git-main-myteam.vercel.app",
        "https://my-custom-deploy-abc123.vercel.app",
    ]
    for origin in origins:
        # 1. Test OPTIONS preflight
        res_opt = client.options(
            "/api/settings",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
        )
        assert res_opt.status_code == 200
        assert res_opt.headers.get("access-control-allow-origin") == origin

        # 2. Test GET request
        res_get = client.get("/health", headers={"Origin": origin})
        assert res_get.status_code == 200
        assert res_get.headers.get("access-control-allow-origin") == origin
```

- [ ] **Step 2: Run test to verify it fails with current localhost-only regex**

Run: `pytest backend/tests/test_cors_vercel.py`
Expected: FAIL (AssertionError: `assert None == 'https://proveit-frontend.vercel.app'`).

- [ ] **Step 3: Update `allow_origin_regex` in `backend/app/main.py`**

Update `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://[a-zA-Z0-9_\-]+\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_cors_vercel.py`
Expected: PASS with 200 and matching origin headers.

---

### Task 5: End-to-End Build & Deployment Verification

**Files:**
- Test all components across frontend, backend, and root build.

- [ ] **Step 1: Run full backend test suite**

Run: `pytest`
Expected: All 42+ tests pass.

- [ ] **Step 2: Test building from root**

Run: `npm run build` (from root `.`)
Expected: Exit code 0.

- [ ] **Step 3: Test building from `frontend/`**

Run: `npm run build` (inside `frontend/`)
Expected: Exit code 0.

- [ ] **Step 4: Verify Next.js dev server runs and serves console**

Verify via Playwright browser navigation to `http://localhost:3000/console`.

- [ ] **Step 5: Commit and sync to `main`**

```bash
git add .
git commit -m "feat(deployment): implement dual-path resilient deployment for Vercel and multi-cloud"
git push origin main
```
