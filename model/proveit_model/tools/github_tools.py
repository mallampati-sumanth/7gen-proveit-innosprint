import logging
import base64
import json
# pyrefly: ignore[missing-import]
import httpx
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class GitHubTools:
    def __init__(self, token: str = ""):
        self.token = token.strip() if token else ""

    def _get_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        tok = (token or self.token or "").strip()
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "ProveIt-Deployment-Agent/1.0",
        }
        if tok and not tok.startswith("your_") and not tok.startswith("ghp_your") and not tok.startswith("ghp_demo"):
            headers["Authorization"] = f"Bearer {tok}"
        return headers

    def get_user_profile(self, token: Optional[str] = None) -> Dict[str, Any]:
        """Fetch real authenticated user profile from GitHub API."""
        headers = self._get_headers(token)
        if "Authorization" not in headers:
            return {
                "connected": False,
                "status": "unauthenticated",
                "message": "No GitHub credentials configured. Please connect a GitHub Personal Access Token.",
            }

        try:
            with httpx.Client(timeout=8.0, verify=False) as client:
                res = client.get("https://api.github.com/user", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "connected": True,
                        "login": data.get("login"),
                        "username": data.get("login"),
                        "name": data.get("name") or data.get("login"),
                        "avatar_url": data.get("avatar_url"),
                        "html_url": data.get("html_url"),
                        "bio": data.get("bio") or "",
                        "followers": data.get("followers", 0),
                        "following": data.get("following", 0),
                        "location": data.get("location") or "",
                        "company": data.get("company") or "",
                        "public_repos": data.get("public_repos", 0),
                        "total_private_repos": data.get("total_private_repos", 0),
                        "status": "authenticated",
                    }
                elif res.status_code == 401:
                    return {
                        "connected": False,
                        "status": "unauthorized",
                        "message": "GitHub Personal Access Token is invalid or expired.",
                    }
                else:
                    return {
                        "connected": False,
                        "status": "error",
                        "message": f"GitHub API error: HTTP {res.status_code} - {res.text[:120]}",
                    }
        except Exception as e:
            logger.error(f"Live GitHub user profile fetch failed: {e}")
            return {
                "connected": False,
                "status": "error",
                "message": f"Connection error: {str(e)}",
            }

    def list_user_repositories(self, token: Optional[str] = None, page: int = 1, per_page: int = 50) -> List[Dict[str, Any]]:
        """Fetch real user repositories directly from GitHub API."""
        headers = self._get_headers(token)
        if "Authorization" not in headers:
            return []

        try:
            with httpx.Client(timeout=20.0, verify=False) as client:
                res = client.get(
                    f"https://api.github.com/user/repos?sort=updated&per_page={per_page}&page={page}&affiliation=owner,collaborator",
                    headers=headers
                )
                if res.status_code == 200:
                    raw_repos = res.json()
                    profile = self.get_user_profile(token)
                    my_login = (profile.get("login") or "").lower()

                    result = []
                    for r in raw_repos:
                        lang = (r.get("language") or "Other").lower()
                        port = 8000 if "python" in lang else (3000 if ("typescript" in lang or "javascript" in lang) else 5000)
                        result.append({
                            "id": str(r.get("id")),
                            "name": r.get("full_name") or r.get("name"),
                            "repo_name": r.get("name"),
                            "owner": r.get("owner", {}).get("login", ""),
                            "description": r.get("description") or "GitHub repository",
                            "language": r.get("language") or "Other",
                            "lang": r.get("language") or "Other",
                            "default_port": port,
                            "port": port,
                            "default_branch": r.get("default_branch", "main"),
                            "clone_url": r.get("clone_url"),
                            "html_url": r.get("html_url"),
                            "private": r.get("private", False),
                            "stars": r.get("stargazers_count", 0),
                            "forks": r.get("forks_count", 0),
                            "updated_at": r.get("updated_at"),
                            "status": "connected",
                        })

                    # Prioritize repositories owned by the authenticated user
                    if my_login:
                        result.sort(key=lambda item: (0 if item.get("owner", "").lower() == my_login else 1, item.get("name", "")))

                    return result
                else:
                    logger.warning(f"GitHub repos fetch returned HTTP {res.status_code}: {res.text[:120]}")
                    return []
        except Exception as e:
            logger.error(f"Live GitHub repos fetch failed: {e}")
            return []

    def inspect_repository(self, repo_url_or_name: str, token: Optional[str] = None, branch: Optional[str] = None) -> Dict[str, Any]:
        """Dynamically fetch and inspect real repository metadata and files from GitHub API."""
        cleaned = (repo_url_or_name or "").strip()
        for prefix in ["https://github.com/", "http://github.com/", "github.com/"]:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
        cleaned = cleaned.strip("/")
        if cleaned.endswith(".git"):
            cleaned = cleaned[:-4]

        parts = cleaned.split("/")
        if len(parts) < 2:
            return {
                "error": True,
                "message": f"Invalid repository identifier '{repo_url_or_name}'. Please use format 'owner/repo' or 'https://github.com/owner/repo'.",
            }

        owner, repo_name = parts[0], parts[1]
        full_name = f"{owner}/{repo_name}"
        headers = self._get_headers(token)

        try:
            with httpx.Client(timeout=10.0, verify=False) as client:
                # 1. Fetch real repo metadata
                meta_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}", headers=headers)
                if meta_res.status_code == 404:
                    return {
                        "error": True,
                        "message": f"Repository '{full_name}' was not found on GitHub. If this is a private repository, please configure a GitHub Token with 'repo' scope.",
                    }
                elif meta_res.status_code == 403:
                    return {
                        "error": True,
                        "message": f"GitHub API rate limit reached for unauthenticated IP. Please connect your GitHub Personal Access Token (PAT) in the 'AWS & GitHub Vault' to get 5,000 requests/hour.",
                    }
                elif meta_res.status_code != 200:
                    return {
                        "error": True,
                        "message": f"GitHub API error fetching repo '{full_name}': HTTP {meta_res.status_code} - {meta_res.text[:100]}",
                    }

                meta = meta_res.json()
                active_branch = branch or meta.get("default_branch", "main")
                primary_language = meta.get("language") or "Unknown"

                # 2. Fetch latest commit SHA on default branch
                commit_sha = "HEAD"
                try:
                    commit_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/commits/{active_branch}", headers=headers)
                    if commit_res.status_code == 200:
                        commit_sha = commit_res.json().get("sha", "HEAD")[:9]
                except Exception:
                    pass

                # 3. Dynamic Stack & Deep Codebase Inspection
                has_dockerfile = False
                dockerfile_snippet = ""
                framework = "Generic Container"
                runtime = primary_language
                detected_port = 8080
                package_manager = "Unknown"
                dependencies_list: List[str] = []
                build_scripts: Dict[str, str] = {}
                discovered_env_lines: List[str] = []
                evidence_sources: List[str] = []
                discovered_keys: List[str] = []

                # Helper to safely fetch decoded file contents
                def fetch_code_file(f_path: str) -> Optional[str]:
                    try:
                        res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/{f_path}?ref={active_branch}", headers=headers)
                        if res.status_code == 200:
                            c = res.json().get("content", "")
                            return base64.b64decode(c).decode("utf-8", errors="ignore")
                    except Exception:
                        pass
                    return None

                # Query root directory contents to discover all manifest and config files
                root_files: Dict[str, Any] = {}
                try:
                    contents_res = client.get(
                        f"https://api.github.com/repos/{owner}/{repo_name}/contents?ref={active_branch}",
                        headers=headers
                    )
                    if contents_res.status_code == 200:
                        raw_items = contents_res.json()
                        if isinstance(raw_items, list):
                            root_files = {item.get("name", "").lower(): item for item in raw_items if isinstance(item, dict)}
                except Exception as e:
                    logger.debug(f"Root contents fetch skipped: {e}")

                # ── STEP A: Discover Environment Template Files (Root & Subdirs) ──
                env_candidates = [".env", ".env.example", ".env.sample", ".env.template", ".env.dist", ".env.local", ".env.development", ".env.production", ".env.defaults"]
                found_env_file = False
                for env_name in env_candidates:
                    if env_name in root_files:
                        raw_env_text = fetch_code_file(root_files[env_name]["name"])
                        if raw_env_text:
                            found_env_file = True
                            src_name = root_files[env_name]["name"]
                            evidence_sources.append(f"Root {src_name}")
                            discovered_env_lines.append(f"# Discovered from {src_name}")
                            for line in raw_env_text.splitlines():
                                clean = line.strip()
                                if clean and not clean.startswith("#") and "=" in clean:
                                    k, v = clean.split("=", 1)
                                    k = k.strip()
                                    v = v.strip().strip("'\"")
                                    discovered_keys.append(k)
                                    # Mask actual private keys/passwords if hardcoded in public repo
                                    if any(s in k.lower() for s in ["secret", "password", "key", "token", "auth"]) and len(v) > 8 and not v.startswith("${"):
                                        v = f"production_placeholder_{k.lower()}"
                                    discovered_env_lines.append(f"{k}={v}")
                            break

                # If no root env file, check common subdirectories
                if not found_env_file:
                    for sub in ["backend", "server", "api", "client", "src"]:
                        if sub in root_files and root_files[sub].get("type") == "dir":
                            for env_name in [".env.example", ".env.sample", ".env", ".env.template"]:
                                raw_sub_env = fetch_code_file(f"{root_files[sub]['name']}/{env_name}")
                                if raw_sub_env:
                                    found_env_file = True
                                    evidence_sources.append(f"{sub}/{env_name}")
                                    discovered_env_lines.append(f"# Discovered from {sub}/{env_name}")
                                    for line in raw_sub_env.splitlines():
                                        clean = line.strip()
                                        if clean and not clean.startswith("#") and "=" in clean:
                                            k, v = clean.split("=", 1)
                                            k = k.strip()
                                            v = v.strip().strip("'\"")
                                            discovered_keys.append(k)
                                            discovered_env_lines.append(f"{k}={v}")
                                    break
                            if found_env_file:
                                break

                # ── STEP B: Check Docker Compose for Defined Environment ──
                for compose_name in ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"]:
                    if compose_name in root_files:
                        raw_compose = fetch_code_file(root_files[compose_name]["name"])
                        if raw_compose:
                            evidence_sources.append(f"Docker Compose ({root_files[compose_name]['name']})")
                            in_env_block = False
                            for line in raw_compose.splitlines():
                                s_line = line.strip()
                                if s_line.startswith("environment:"):
                                    in_env_block = True
                                    continue
                                if in_env_block:
                                    if s_line.startswith("- "):
                                        env_item = s_line[2:].strip().strip("'\"")
                                        if "=" in env_item:
                                            ek, ev = env_item.split("=", 1)
                                            ek = ek.strip()
                                            if ek not in discovered_keys:
                                                discovered_keys.append(ek)
                                                discovered_env_lines.append(f"{ek}={ev.strip()}")
                                    elif s_line and not s_line.startswith("#") and not s_line.startswith("-"):
                                        in_env_block = False

                # ── STEP C: Check Dockerfile ──
                if "dockerfile" in root_files or "dockerfile.prod" in root_files:
                    df_name = root_files.get("dockerfile", root_files.get("dockerfile.prod", {})).get("name", "Dockerfile")
                    df_raw = fetch_code_file(df_name)
                    if df_raw:
                        has_dockerfile = True
                        evidence_sources.append(f"Dockerfile ({df_name})")
                        for line in df_raw.splitlines():
                            if line.strip().upper().startswith("FROM "):
                                dockerfile_snippet = line.strip()
                            if line.strip().upper().startswith("EXPOSE "):
                                try:
                                    exposed = int(line.strip().split()[1].split("/")[0])
                                    detected_port = exposed
                                except Exception:
                                    pass
                            if line.strip().upper().startswith("ENV "):
                                env_entry = line.strip()[4:].strip()
                                if "=" in env_entry:
                                    ek, ev = env_entry.split("=", 1)
                                    ek = ek.strip()
                                    if ek not in discovered_keys:
                                        discovered_keys.append(ek)
                                        discovered_env_lines.append(f"{ek}={ev.strip()}")

                # ── STEP D: Framework & Deep Codebase Inspection ──
                # 1. Django Framework Priority Check (e.g. manage.py, cmr, hub, settings.py)
                is_django = ("manage.py" in root_files) or ("django" in repo_name.lower()) or ("django" in full_name.lower())
                if is_django:
                    framework = "Django Web Framework"
                    runtime = "Python 3.11 / Django 5.x"
                    detected_port = 8000
                    package_manager = "pip / poetry"
                    
                    # Search subdirectories for settings.py
                    settings_content = None
                    settings_source = None
                    for dir_name, dir_item in root_files.items():
                        if dir_item.get("type") == "dir" and not dir_name.startswith("."):
                            try:
                                sub_res = client.get(dir_item["url"], headers=headers)
                                if sub_res.status_code == 200 and isinstance(sub_res.json(), list):
                                    for sub_item in sub_res.json():
                                        if sub_item.get("name") == "settings.py":
                                            c = fetch_code_file(f"{dir_item['name']}/settings.py")
                                            if c:
                                                settings_content = c
                                                settings_source = f"{dir_item['name']}/settings.py"
                                                break
                            except Exception:
                                pass
                        if settings_content:
                            break

                    if settings_content:
                        evidence_sources.append(f"Django Settings ({settings_source})")
                        discovered_env_lines.append(f"# Discovered from Django Configuration ({settings_source})")
                        
                        # Extract SECRET_KEY
                        import re
                        sk_match = re.search(r"SECRET_KEY\s*=\s*['\"]([^'\"]+)['\"]", settings_content)
                        if sk_match and "SECRET_KEY" not in discovered_keys:
                            discovered_keys.append("SECRET_KEY")
                            discovered_env_lines.append("SECRET_KEY=django-insecure-prod-generated-key-replace-in-production")
                        
                        if "DEBUG" not in discovered_keys:
                            discovered_keys.append("DEBUG")
                            discovered_env_lines.append("DEBUG=False")
                        
                        if "ALLOWED_HOSTS" not in discovered_keys:
                            discovered_keys.append("ALLOWED_HOSTS")
                            discovered_env_lines.append("ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0")

                        # Parse Django DATABASES engine, user, password, name
                        db_engine = re.search(r"['\"]ENGINE['\"]\s*:\s*['\"]([^'\"]+)['\"]", settings_content)
                        db_name = re.search(r"['\"]NAME['\"]\s*:\s*['\"]([^'\"]+)['\"]", settings_content)
                        db_user = re.search(r"['\"]USER['\"]\s*:\s*['\"]([^'\"]+)['\"]", settings_content)
                        db_pass = re.search(r"['\"]PASSWORD['\"]\s*:\s*['\"]([^'\"]+)['\"]", settings_content)
                        
                        engine_val = db_engine.group(1) if db_engine else "django.db.backends.postgresql"
                        name_val = db_name.group(1) if db_name else repo_name
                        user_val = db_user.group(1) if db_user else "postgres"
                        pass_val = db_pass.group(1) if db_pass else "password"
                        
                        if "postgresql" in engine_val:
                            discovered_env_lines.append(f"DATABASE_URL=postgres://{user_val}:{pass_val}@localhost:5432/{name_val}")
                            discovered_env_lines.append("DB_ENGINE=django.db.backends.postgresql")
                            discovered_env_lines.append(f"DB_NAME={name_val}")
                            discovered_env_lines.append(f"DB_USER={user_val}")
                            discovered_env_lines.append(f"DB_PASSWORD={pass_val}")
                            discovered_env_lines.append("DB_HOST=localhost")
                            discovered_env_lines.append("DB_PORT=5432")
                        elif "mysql" in engine_val:
                            discovered_env_lines.append(f"DATABASE_URL=mysql://{user_val}:{pass_val}@localhost:3306/{name_val}")
                            discovered_env_lines.append("DB_ENGINE=django.db.backends.mysql")
                            discovered_env_lines.append(f"DB_NAME={name_val}")
                            discovered_env_lines.append(f"DB_USER={user_val}")
                            discovered_env_lines.append(f"DB_PASSWORD={pass_val}")
                            discovered_env_lines.append("DB_HOST=localhost")
                            discovered_env_lines.append("DB_PORT=3306")
                        else:
                            discovered_env_lines.append(f"DATABASE_URL=sqlite:///{name_val}.sqlite3")
                        
                        app_prefix = settings_source.split("/")[0]
                        discovered_env_lines.append(f"DJANGO_SETTINGS_MODULE={app_prefix}.settings")

                # 2. Check package.json (Node/JS/TS) if not identified as primary Django backend
                elif "package.json" in root_files:
                    raw_pj = fetch_code_file("package.json")
                    if raw_pj:
                        try:
                            pj = json.loads(raw_pj)
                            deps = {**pj.get("dependencies", {}), **pj.get("devDependencies", {})}
                            dependencies_list = list(deps.keys())[:25]
                            build_scripts = pj.get("scripts", {})
                            package_manager = "pnpm" if "pnpm-lock.yaml" in root_files else "yarn" if "yarn.lock" in root_files else "npm (package.json)"
                            runtime = "Node.js 20 (TypeScript / JavaScript)"
                            
                            if "next" in deps:
                                framework = "Next.js 14 App Router"
                                detected_port = 3000
                                discovered_env_lines.append("NEXT_PUBLIC_APP_URL=http://localhost:3000")
                            elif "@nestjs/core" in deps:
                                framework = "NestJS Enterprise Service"
                                detected_port = 3000
                                discovered_env_lines.append("NODE_ENV=production")
                            elif "express" in deps:
                                framework = "Express.js REST API"
                                detected_port = 5000
                                discovered_env_lines.append("NODE_ENV=production")
                            elif "fastify" in deps:
                                framework = "Fastify Service"
                                detected_port = 3000
                                discovered_env_lines.append("NODE_ENV=production")
                            elif "vite" in deps or "react-scripts" in deps or "react" in deps:
                                framework = "React Application (Vite / CRA)"
                                detected_port = 5173
                            else:
                                framework = "Node.js Application"
                                detected_port = 3000

                            # Infer database and service env vars from package.json dependencies
                            if any(d in deps for d in ["pg", "pg-hstore", "sequelize", "typeorm", "prisma"]):
                                if "DATABASE_URL" not in discovered_keys and not any("DB_" in k for k in discovered_keys):
                                    discovered_env_lines.append(f"DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{repo_name}")
                            if any(d in deps for d in ["mongodb", "mongoose"]):
                                if "MONGODB_URI" not in discovered_keys:
                                    discovered_env_lines.append(f"MONGODB_URI=mongodb://localhost:27017/{repo_name}")
                            if any(d in deps for d in ["redis", "ioredis"]):
                                if "REDIS_URL" not in discovered_keys:
                                    discovered_env_lines.append("REDIS_URL=redis://localhost:6379")
                            if any(d in deps for d in ["jsonwebtoken", "jwt-simple"]):
                                if "JWT_SECRET" not in discovered_keys:
                                    discovered_env_lines.append("JWT_SECRET=production_jwt_secret_token_change_in_prod")
                            if any(d in deps for d in ["sendgrid", "@sendgrid/mail"]):
                                if "SENDGRID_API_KEY" not in discovered_keys:
                                    discovered_env_lines.append("SENDGRID_API_KEY=SG.your_sendgrid_key_here")

                            # Scan main server files for process.env references
                            import re
                            found_proc_vars = set()
                            for sc in ["server.js", "app.js", "index.js", "api/server.js", "api/index.js", "server/index.js", "src/index.ts", "src/server.ts"]:
                                code_txt = fetch_code_file(sc)
                                if code_txt:
                                    evidence_sources.append(f"Source file {sc}")
                                    for m in re.finditer(r"process\.env\.([A-Z0-9_]{3,})", code_txt):
                                        found_proc_vars.add(m.group(1))

                            if found_proc_vars:
                                discovered_env_lines.append("# Discovered process.env variables from source code")
                                for pv in sorted(found_proc_vars):
                                    if pv not in discovered_keys and pv not in ["PORT", "NODE_ENV"]:
                                        discovered_keys.append(pv)
                                        discovered_env_lines.append(f"{pv}=configured_in_code")
                        except Exception:
                            pass

                # 3. Check pyproject.toml / requirements.txt (Python FastAPI / Flask)
                if not is_django and ("pyproject.toml" in root_files or "requirements.txt" in root_files):
                    runtime = "Python 3.11+"
                    req_content = fetch_code_file("requirements.txt") or fetch_code_file("pyproject.toml") or ""
                    req_lower = req_content.lower()
                    
                    if "fastapi" in req_lower:
                        framework = "FastAPI + Uvicorn ASGI"
                        detected_port = 8000
                    elif "flask" in req_lower:
                        framework = "Flask WSGI"
                        detected_port = 5000
                    elif "litestar" in req_lower:
                        framework = "Litestar ASGI"
                        detected_port = 8000
                    else:
                        framework = "Python Modern Service"
                        detected_port = 8000

                    # Scan main.py, app.py, config.py for os.getenv
                    import re
                    found_py_vars = set()
                    for pf in ["main.py", "app.py", "config.py", "settings.py", "app/main.py", "app/config.py"]:
                        py_txt = fetch_code_file(pf)
                        if py_txt:
                            evidence_sources.append(f"Python module {pf}")
                            for m in re.finditer(r"(?:os\.getenv|os\.environ(?:\.get)?)\(['\"]([A-Z0-9_]{3,})['\"]", py_txt):
                                found_py_vars.add(m.group(1))

                    if found_py_vars:
                        discovered_env_lines.append("# Discovered os.getenv variables from Python code")
                        for pv in sorted(found_py_vars):
                            if pv not in discovered_keys and pv not in ["PORT", "ENVIRONMENT"]:
                                discovered_keys.append(pv)
                                discovered_env_lines.append(f"{pv}=configured_in_code")

                    if any(db in req_lower for db in ["sqlalchemy", "asyncpg", "psycopg2"]):
                        if "DATABASE_URL" not in discovered_keys:
                            discovered_env_lines.append(f"DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{repo_name}")
                    if "redis" in req_lower and "REDIS_URL" not in discovered_keys:
                        discovered_env_lines.append("REDIS_URL=redis://localhost:6379")

                # 4. Check Go manifest (go.mod)
                if "go.mod" in root_files:
                    go_text = fetch_code_file("go.mod") or ""
                    package_manager = "go modules (go.mod)"
                    runtime = "Go 1.22"
                    detected_port = 8080
                    if "gin-gonic/gin" in go_text:
                        framework = "Gin Web Framework (Go)"
                    elif "gofiber/fiber" in go_text:
                        framework = "Fiber Web Framework (Go)"
                    else:
                        framework = "Go Microservice"

                # 5. Check Rust manifest (Cargo.toml)
                if "cargo.toml" in root_files:
                    package_manager = "cargo (Cargo.toml)"
                    runtime = "Rust"
                    framework = "Rust High-Performance Service"
                    detected_port = 8080

                # ── STEP E: Synthesize 100% Dynamic .env Recommendation ──
                # Append standard platform and deployment overrides tailored to detected port
                discovered_env_lines.append(f"PORT={detected_port}")
                discovered_env_lines.append("ENVIRONMENT=production")
                discovered_env_lines.append("AWS_REGION=us-east-1")
                discovered_env_lines.append(f"APP_NAME={repo_name}")
                discovered_env_lines.append(f"COMMIT_SHA={commit_sha}")

                # Build clean final .env with provenance header
                unique_lines: List[str] = []
                seen_keys = set()
                for el in discovered_env_lines:
                    if el.startswith("#"):
                        unique_lines.append(el)
                    elif "=" in el:
                        k_name = el.split("=", 1)[0].strip()
                        if k_name not in seen_keys:
                            seen_keys.add(k_name)
                            unique_lines.append(el)

                recommended_env = "\n".join(unique_lines)

                return {
                    "repository": full_name,
                    "repo_name": repo_name,
                    "owner": owner,
                    "branch": active_branch,
                    "commit_sha": commit_sha,
                    "description": meta.get("description") or "Live GitHub repository",
                    "stars": meta.get("stargazers_count", 0),
                    "forks": meta.get("forks_count", 0),
                    "open_issues": meta.get("open_issues_count", 0),
                    "private": meta.get("private", False),
                    "html_url": meta.get("html_url"),
                    "clone_url": meta.get("clone_url"),
                    "runtime": runtime,
                    "framework": framework,
                    "port": detected_port,
                    "has_dockerfile": has_dockerfile,
                    "dockerfile_base": dockerfile_snippet,
                    "package_manager": package_manager,
                    "dependencies": dependencies_list,
                    "scripts": build_scripts,
                    "health_endpoint": "/health",
                    "recommended_env": recommended_env,
                }
        except Exception as e:
            logger.error(f"Error inspecting repository '{full_name}': {e}")
            return {
                "error": True,
                "message": f"Failed to connect to GitHub API for '{full_name}': {str(e)}",
            }
