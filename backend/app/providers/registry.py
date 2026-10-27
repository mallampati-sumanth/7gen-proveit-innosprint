from typing import Dict, Any, List, Optional
from backend.app.providers.base import BaseCloudProvider
from backend.app.providers.vercel_provider import VercelProvider
from backend.app.providers.render_provider import RenderProvider
from backend.app.providers.railway_provider import RailwayProvider


class CloudProviderRegistry:
    _instance: Optional["CloudProviderRegistry"] = None

    def __init__(self):
        self.providers: Dict[str, BaseCloudProvider] = {
            "vercel": VercelProvider(),
            "render": RenderProvider(),
            "railway": RailwayProvider(),
        }

    @classmethod
    def get_instance(cls) -> "CloudProviderRegistry":
        if cls._instance is None:
            cls._instance = CloudProviderRegistry()
        return cls._instance

    @classmethod
    def get_provider(cls, name: str) -> Optional[BaseCloudProvider]:
        return cls.get_instance().providers.get(name.lower().strip())

    @classmethod
    def recommend(cls, repo_name: str, detected_language: Optional[str] = None, framework: Optional[str] = None) -> Dict[str, Any]:
        return cls.get_instance().recommend_provider(repo_name, detected_language, framework)

    def list_providers(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "vercel",
                "name": "Vercel",
                "icon": "▲",
                "category": "Frontend & Edge",
                "description": "Zero-config edge network for Next.js, React, and serverless APIs.",
                "badges": ["Edge CDN", "Instant Preview", "Next.js"],
            },
            {
                "id": "render",
                "name": "Render",
                "icon": "⬢",
                "category": "Web Services & APIs",
                "description": "Auto-scaling cloud for FastAPI, Flask, Express, and Docker apps.",
                "badges": ["Free TLS", "Auto-Deploy", "FastAPI / Node"],
            },
            {
                "id": "railway",
                "name": "Railway",
                "icon": "🚂",
                "category": "Full-Stack & Containers",
                "description": "Deploy code, Dockerfiles, and persistent databases effortlessly.",
                "badges": ["PostgreSQL", "Nixpacks", "Microservices"],
            },
            {
                "id": "aws",
                "name": "AWS EC2",
                "icon": "☁",
                "category": "Infrastructure (IaaS)",
                "description": "Isolated virtual machines with root Docker daemon access and full control.",
                "badges": ["Custom VM", "Root Access", "VPC"],
            },
        ]

    def recommend_provider(self, repo_name: str, detected_language: Optional[str] = None, framework: Optional[str] = None) -> Dict[str, Any]:
        """
        AI Heuristic / LLM Codebase analysis to select optimal deployment platform:
        - Next.js / React / Frontend -> Vercel
        - Python / FastAPI / Flask / Node backend -> Render
        - Docker / Microservices / DB -> Railway or AWS
        """
        r_lower = (repo_name or "").lower()
        f_lower = (framework or "").lower()
        l_lower = (detected_language or "").lower()

        # Check frontend/next
        if any(kw in r_lower or kw in f_lower for kw in ["next", "react", "vue", "astro", "svelte", "frontend", "web", "landing", "ui"]):
            return {
                "recommended_provider": "vercel",
                "confidence": 0.96,
                "reason": "Next.js / Frontend framework detected. Vercel provides zero-config edge rendering, global CDN caching, and automated preview branch URLs.",
                "ideal_for": "Static assets, SSR, Edge APIs, React, Next.js",
            }

        # Check Python / FastAPI / Flask
        if any(kw in r_lower or kw in f_lower or kw in l_lower for kw in ["python", "fastapi", "flask", "django", "api", "backend", "express"]):
            return {
                "recommended_provider": "render",
                "confidence": 0.94,
                "reason": "Python/FastAPI or Node backend detected. Render offers seamless Dockerized web service hosting with automatic SSL, HTTP/2, and background workers.",
                "ideal_for": "REST APIs, FastAPI, Flask, Node.js, automated health probes",
            }

        # Check multi-container / heavy workloads
        if any(kw in r_lower for kw in ["docker", "cluster", "service", "db", "infra"]):
            return {
                "recommended_provider": "railway",
                "confidence": 0.91,
                "reason": "Containerized multi-service codebase detected. Railway provides effortless Nixpacks OCI container builds and managed database support.",
                "ideal_for": "Dockerfiles, persistent storage, microservice architectures",
            }

        # Default recommendation
        return {
            "recommended_provider": "render",
            "confidence": 0.88,
            "reason": "Render is recommended as the balanced, all-purpose web application host with zero-downtime rolling deploys and automatic health monitoring.",
            "ideal_for": "General web applications, containers, and webhooks",
        }


cloud_registry = CloudProviderRegistry()
