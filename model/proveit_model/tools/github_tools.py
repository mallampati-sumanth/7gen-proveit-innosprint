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
            with httpx.Client(timeout=8.0) as client:
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
            with httpx.Client(timeout=10.0) as client:
                res = client.get(
                    f"https://api.github.com/user/repos?sort=updated&per_page={per_page}&page={page}&affiliation=owner,collaborator,organization_member",
                    headers=headers
                )
                if res.status_code == 200:
                    raw_repos = res.json()
                    result = []
                    for r in raw_repos:
                        result.append({
                            "id": str(r.get("id")),
                            "name": r.get("full_name") or r.get("name"),
                            "repo_name": r.get("name"),
                            "owner": r.get("owner", {}).get("login", ""),
                            "description": r.get("description") or "GitHub repository",
                            "language": r.get("language") or "Other",
                            "default_branch": r.get("default_branch", "main"),
                            "clone_url": r.get("clone_url"),
                            "html_url": r.get("html_url"),
                            "private": r.get("private", False),
                            "stars": r.get("stargazers_count", 0),
                            "forks": r.get("forks_count", 0),
                            "updated_at": r.get("updated_at"),
                            "status": "connected",
                        })
                    return result
                else:
                    logger.warning(f"GitHub repos fetch returned HTTP {res.status_code}: {res.text[:120]}")
                    return []
        except Exception as e:
            logger.error(f"Live GitHub repos fetch failed: {e}")
            return []

    def inspect_repository(self, repo_url_or_name: str, token: Optional[str] = None, branch: Optional[str] = None) -> Dict[str, Any]:
        """Dynamically fetch and inspect real repository metadata and files from GitHub API."""
        cleaned = repo_url_or_name.replace("https://github.com/", "").replace("http://github.com/", "").replace("github.com/", "").strip("/")
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
            with httpx.Client(timeout=10.0) as client:
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

                # 3. Dynamic Stack Detection by reading repository contents
                has_dockerfile = False
                dockerfile_snippet = ""
                framework = "Generic Container"
                runtime = primary_language
                detected_port = 8080
                package_manager = "Unknown"
                dependencies_list: List[str] = []
                build_scripts: Dict[str, str] = {}
                recommended_env_custom: Optional[str] = None

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

                # Check for .env.example or .env.sample in repository
                for env_file in [".env.example", ".env.sample", ".env.template"]:
                    if env_file in root_files:
                        try:
                            env_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/{root_files[env_file]['name']}?ref={active_branch}", headers=headers)
                            if env_res.status_code == 200:
                                b64_c = env_res.json().get("content", "")
                                recommended_env_custom = base64.b64decode(b64_c).decode("utf-8", errors="ignore").strip()
                                break
                        except Exception:
                            pass

                # Check Dockerfile
                if "dockerfile" in root_files or "dockerfile.prod" in root_files:
                    df_name = root_files.get("dockerfile", root_files.get("dockerfile.prod", {})).get("name", "Dockerfile")
                    try:
                        df_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/{df_name}?ref={active_branch}", headers=headers)
                        if df_res.status_code == 200:
                            has_dockerfile = True
                            content_b64 = df_res.json().get("content", "")
                            df_raw = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
                            for line in df_raw.splitlines():
                                if line.strip().upper().startswith("FROM "):
                                    dockerfile_snippet = line.strip()
                                if line.strip().upper().startswith("EXPOSE "):
                                    try:
                                        exposed = int(line.strip().split()[1].split("/")[0])
                                        detected_port = exposed
                                    except Exception:
                                        pass
                    except Exception:
                        pass

                # Check package.json (Node/JS/TS)
                if "package.json" in root_files:
                    try:
                        pj_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/package.json?ref={active_branch}", headers=headers)
                        if pj_res.status_code == 200:
                            content_b64 = pj_res.json().get("content", "")
                            raw_pj = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
                            pj = json.loads(raw_pj)
                            deps = {**pj.get("dependencies", {}), **pj.get("devDependencies", {})}
                            dependencies_list = list(deps.keys())[:20]
                            build_scripts = pj.get("scripts", {})
                            package_manager = "pnpm" if "pnpm-lock.yaml" in root_files else "yarn" if "yarn.lock" in root_files else "npm (package.json)"
                            runtime = "Node.js 20 (TypeScript / JavaScript)"
                            if "next" in deps:
                                framework = "Next.js 14 App Router"
                                detected_port = 3000
                            elif "@nestjs/core" in deps:
                                framework = "NestJS"
                                detected_port = 3000
                            elif "express" in deps:
                                framework = "Express.js REST API"
                                detected_port = 5000
                            elif "fastify" in deps:
                                framework = "Fastify Service"
                                detected_port = 3000
                            elif "vite" in deps or "react-scripts" in deps or "react" in deps:
                                framework = "React (Vite / CRA)"
                                detected_port = 5173
                            elif "vue" in deps or "nuxt" in deps:
                                framework = "Nuxt / Vue"
                                detected_port = 3000
                            else:
                                framework = "Node.js Application"
                                detected_port = 3000
                    except Exception:
                        pass

                # Check pyproject.toml (Modern Python PEP 518/621, Poetry, Flit, PDM, Hatch)
                if "pyproject.toml" in root_files:
                    try:
                        pyp_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/pyproject.toml?ref={active_branch}", headers=headers)
                        if pyp_res.status_code == 200:
                            content_b64 = pyp_res.json().get("content", "")
                            pyp_raw = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
                            runtime = "Python 3.11+"
                            package_manager = "uv" if "uv.lock" in root_files else "poetry" if "poetry.lock" in root_files else "pyproject.toml (PEP 621)"
                            
                            # Parse dependencies from pyproject
                            in_deps = False
                            for line in pyp_raw.splitlines():
                                clean = line.strip()
                                if "dependencies = [" in clean or clean == "dependencies = [":
                                    in_deps = True
                                    continue
                                if in_deps:
                                    if clean.startswith("]"):
                                        in_deps = False
                                    else:
                                        dep_candidate = clean.strip('",\'[]')
                                        for sep in [">=", "<=", "==", "~=", "!=", ">", "<", ";", " "]:
                                            dep_candidate = dep_candidate.split(sep)[0].strip()
                                        if dep_candidate and not dep_candidate.startswith("#"):
                                            dependencies_list.append(dep_candidate)

                            pyp_lower = pyp_raw.lower()
                            repo_lower = full_name.lower()
                            if "fastapi" in repo_lower or 'name = "fastapi"' in pyp_lower or "fastapi" in pyp_lower:
                                framework = "FastAPI + Uvicorn ASGI"
                                detected_port = 8000
                            elif "flask" in repo_lower or 'name = "flask"' in pyp_lower or "flask" in pyp_lower:
                                framework = "Flask WSGI"
                                detected_port = 5000
                            elif "django" in repo_lower or "django" in pyp_lower:
                                framework = "Django Web Framework"
                                detected_port = 8000
                            elif "litestar" in pyp_lower:
                                framework = "Litestar ASGI"
                                detected_port = 8000
                            else:
                                framework = "Python Modern Service"
                                detected_port = 8000
                    except Exception as e:
                        logger.debug(f"pyproject.toml parse error: {e}")

                # Check requirements.txt
                if "requirements.txt" in root_files and not dependencies_list:
                    try:
                        req_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/requirements.txt?ref={active_branch}", headers=headers)
                        if req_res.status_code == 200:
                            content_b64 = req_res.json().get("content", "")
                            req_text = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
                            req_lines = [l.strip().split("==")[0].split(">=")[0].split("<=")[0].split("~=")[0] for l in req_text.splitlines() if l.strip() and not l.startswith("#")]
                            dependencies_list = req_lines[:20]
                            package_manager = "pip (requirements.txt)"
                            runtime = "Python 3.11"
                            req_lower = req_text.lower()
                            if "fastapi" in req_lower:
                                framework = "FastAPI + Uvicorn ASGI"
                                detected_port = 8000
                            elif "flask" in req_lower:
                                framework = "Flask WSGI"
                                detected_port = 5000
                            elif "django" in req_lower:
                                framework = "Django Web Framework"
                                detected_port = 8000
                            else:
                                framework = "Python Service"
                                detected_port = 8000
                    except Exception:
                        pass

                # Check Go manifest (go.mod)
                if "go.mod" in root_files:
                    try:
                        go_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/go.mod?ref={active_branch}", headers=headers)
                        if go_res.status_code == 200:
                            content_b64 = go_res.json().get("content", "")
                            go_text = base64.b64decode(content_b64).decode("utf-8", errors="ignore")
                            package_manager = "go modules (go.mod)"
                            runtime = "Go 1.22"
                            if "gin-gonic/gin" in go_text:
                                framework = "Gin Web Framework (Go)"
                            elif "gofiber/fiber" in go_text:
                                framework = "Fiber Web Framework (Go)"
                            elif "labstack/echo" in go_text:
                                framework = "Echo Web Framework (Go)"
                            else:
                                framework = "Go Microservice"
                            detected_port = 8080
                    except Exception:
                        pass

                # Check Rust manifest (Cargo.toml)
                if "cargo.toml" in root_files:
                    try:
                        cargo_res = client.get(f"https://api.github.com/repos/{owner}/{repo_name}/contents/Cargo.toml?ref={active_branch}", headers=headers)
                        if cargo_res.status_code == 200:
                            package_manager = "cargo (Cargo.toml)"
                            runtime = "Rust"
                            framework = "Rust High-Performance Service"
                            detected_port = 8080
                    except Exception:
                        pass

                # Name-based / description fallback if framework still generic
                if framework == "Generic Container":
                    n_lower = full_name.lower()
                    d_lower = (meta.get("description") or "").lower()
                    if "fastapi" in n_lower or "fastapi" in d_lower:
                        framework = "FastAPI + Uvicorn ASGI"
                        detected_port = 8000
                        runtime = "Python 3.11"
                    elif "flask" in n_lower or "flask" in d_lower:
                        framework = "Flask WSGI"
                        detected_port = 5000
                        runtime = "Python 3.11"
                    elif "django" in n_lower or "django" in d_lower:
                        framework = "Django Web Framework"
                        detected_port = 8000
                        runtime = "Python 3.11"
                    elif "react" in n_lower or "react" in d_lower:
                        framework = "React Application"
                        detected_port = 3000
                        runtime = "Node.js"

                # Generate recommended real .env based on inspected repo
                if recommended_env_custom:
                    recommended_env = f"""# Detected from repository .env.example
{recommended_env_custom}
# Platform Deployment Overrides
PORT={detected_port}
ENVIRONMENT=production
AWS_REGION=us-east-1"""
                else:
                    recommended_env = f"""# Dynamically generated deployment .env for {full_name}
PORT={detected_port}
ENVIRONMENT=production
AWS_REGION=us-east-1
HEALTHCHECK_PATH=/health
LOG_LEVEL=INFO
APP_NAME={repo_name}
COMMIT_SHA={commit_sha}"""

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
