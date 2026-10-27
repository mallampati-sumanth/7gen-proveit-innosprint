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
    ) -> DeploymentResult:
        """Triggers deployment and returns DeploymentResult with live URL or status."""
        pass

    @abstractmethod
    async def get_deployment_status(self, deployment_id: str) -> DeploymentResult:
        """Fetches live build/deployment status from the provider."""
        pass

    @abstractmethod
    async def rollback(self, deployment_id: str) -> Dict[str, Any]:
        """Rolls back to the previous stable deployment on this provider."""
        pass
