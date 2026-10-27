import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel


class DeploymentResult(BaseModel):
    provider: str
    deployment_id: str
    status: str  # "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELLED"
    live_url: Optional[str] = None
    preview_url: Optional[str] = None
    build_logs: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: float = 0.0

    def __init__(self, **data):
        if "created_at" not in data or not data["created_at"]:
            data["created_at"] = time.time()
        super().__init__(**data)

    @property
    def public_url(self) -> Optional[str]:
        return self.live_url or self.preview_url

    @property
    def proof_hash(self) -> str:
        import hashlib
        return hashlib.sha256(f"{self.provider}:{self.deployment_id}:{self.live_url}".encode()).hexdigest()


class BaseCloudProvider(ABC):
    name: str
    display_name: str
    icon: str
    description: str

    @abstractmethod
    async def is_configured(self) -> bool:
        """Returns True if the provider has valid credentials/token configured."""
        pass

    @abstractmethod
    async def deploy_repository(
        self,
        repo_name: str,
        branch: str = "main",
        env_vars: Optional[Dict[str, str]] = None,
        commit_hash: Optional[str] = None,
        service_type: Optional[str] = None,
        github_token: Optional[str] = None,
        environment: str = "production",
        **kwargs: Any,
    ) -> DeploymentResult:
        """Triggers deployment and returns DeploymentResult with live URL or status."""
        pass

    def deploy(
        self,
        repo_name: str,
        branch: str = "main",
        environment: str = "production",
        env_vars: Optional[Dict[str, str]] = None,
    ) -> DeploymentResult:
        """Synchronous wrapper for deploy_repository for sync telephony and script handlers."""
        import asyncio
        import concurrent.futures
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(
                        asyncio.run,
                        self.deploy_repository(repo_name, branch=branch, env_vars=env_vars),
                    ).result()
            return loop.run_until_complete(
                self.deploy_repository(repo_name, branch=branch, env_vars=env_vars)
            )
        except Exception:
            return asyncio.run(
                self.deploy_repository(repo_name, branch=branch, env_vars=env_vars)
            )

    @abstractmethod
    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        """Fetches live build/deployment status from the provider."""
        pass

    @abstractmethod
    async def rollback(self, deployment_id: str) -> Dict[str, Any]:
        """Rolls back to the previous stable deployment on this provider."""
        pass
