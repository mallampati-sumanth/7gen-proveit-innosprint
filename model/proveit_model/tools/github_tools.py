import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class GitHubTools:
    def __init__(self, token: str = ""):
        self.token = token

    def inspect_repository(self, repo_url: str, branch: str = "main") -> Dict[str, Any]:
        repo_name = repo_url.replace("https://github.com/", "").replace("github.com/", "").strip("/")
        is_python = "python" in repo_name.lower() or "fastapi" in repo_name.lower()
        
        runtime = "Python 3.11" if is_python else "Node.js 20"
        framework = "FastAPI + Uvicorn" if is_python else "Next.js 14 App Router"
        port = 8000 if is_python else 3000
        pkg_manager = "pip / requirements.txt" if is_python else "npm / package.json"

        return {
            "repository": repo_name,
            "branch": branch,
            "commit_sha": "a8f4c2e1b",
            "runtime": runtime,
            "framework": framework,
            "port": port,
            "has_dockerfile": True,
            "package_manager": pkg_manager,
            "health_endpoint": "/health",
            "recommended_env": f"""# Auto-generated deployment .env for {repo_name}
PORT={port}
ENVIRONMENT=production
AWS_REGION=us-east-1
AWS_ECR_REPO=proveit-{repo_name.split('/')[-1]}
AWS_ECS_CLUSTER=proveit-production-cluster
CONTAINER_CPU=512
CONTAINER_MEMORY=1024
HEALTHCHECK_PATH=/health
LOG_STREAM_ENABLED=true
AUTOSCALING_MIN=1
AUTOSCALING_MAX=3""",
        }
