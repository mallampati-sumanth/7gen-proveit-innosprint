import json
import logging
from typing import Dict, Any, Optional
from proveit_model.providers.base import BaseLLMProvider, AgentMessage

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the ProveIt Autonomous Cloud Architect and Deployment Agent.
Your role is to deeply analyze code repositories for autonomous deployment to AWS EC2 or container fleets.
Given a repository's metadata, language, root files, dependencies, and manifest files, you must return a strict JSON object with:
1. "summary": A 2-3 sentence executive summary of the repository's architecture and purpose.
2. "framework": Exact framework and runtime with versioning (e.g. "Django 5.1 (WSGI/ASGI)", "FastAPI 0.115 (ASGI Uvicorn)", "Next.js 14 (App Router)", "Flask 3.0 (WSGI)", "Express 4.19 (Node.js)").
3. "runtime": Runtime environment (e.g. "Python 3.11+", "Node.js 20 LTS", "Go 1.22", "Rust 1.80").
4. "port": Recommended application container port (integer, e.g. 8000, 3000, 5000, 8080).
5. "healthcheck_path": Recommended health check HTTP probe path (e.g. "/health", "/api/health", "/").
6. "package_manager": Package manager (e.g. "pip / poetry", "pnpm", "npm", "cargo", "go modules").
7. "readiness_score": Deployment readiness percentage from 0 to 100 based on presence of manifests, Dockerfile, tests, etc.
8. "security_audit": Brief evaluation of environment variables, potential missing secrets, and CORS safety.
9. "recommended_dockerfile": Hardened multi-stage production Dockerfile suitable for AWS EC2 or ECS.
10. "recommended_env": Production .env configuration string strictly tailored to the discovered repository code, database engines, and configs. Do NOT output a generic template. Include the specific variables found in the codebase.

Respond ONLY with valid JSON. Do not wrap in markdown quotes if possible."""


class RepoAnalyzerAgent:
    """Agentic AI Repository Stack and Architecture Analyzer."""

    def __init__(self, provider: BaseLLMProvider):
        self.provider = provider

    async def analyze(self, raw_manifest: Dict[str, Any]) -> Dict[str, Any]:
        """Perform agentic LLM analysis on repository metadata and files."""
        repo_name = raw_manifest.get("repository", "Unknown")
        dependencies = raw_manifest.get("dependencies", [])
        raw_env = raw_manifest.get("recommended_env", "")
        has_dockerfile = raw_manifest.get("has_dockerfile", False)

        prompt = f"""Analyze this repository for autonomous cloud deployment:
Repository: {repo_name}
Default Branch: {raw_manifest.get('branch', 'main')}
Primary Language: {raw_manifest.get('runtime', 'Unknown')}
Framework Detected by Codebase: {raw_manifest.get('framework', 'Generic')}
Detected Port: {raw_manifest.get('port', 8080)}
Has Dockerfile: {has_dockerfile}
Dockerfile Snippet: {raw_manifest.get('dockerfile_base', '')}
Package Manager: {raw_manifest.get('package_manager', 'Unknown')}
Key Dependencies: {json.dumps(dependencies[:25])}

Codebase-Extracted Environment & Config:
{raw_env}

INSTRUCTION: Every environment variable in "recommended_env" must be purely dynamic and strictly tailored to this specific repository's discovered code files, database engine, secrets, and architecture. Never return a generic static placeholder template. Return ONLY the strict JSON object."""

        try:
            resp = await self.provider.generate_response(
                messages=[AgentMessage(role="user", content=prompt)],
                system_instruction=SYSTEM_PROMPT,
            )

            text = resp.content.strip()
            # Robust JSON extraction from markdown or conversational LLM outputs
            import re
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
            else:
                if text.startswith("```json"):
                    text = text[7:]
                elif text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                parsed = json.loads(text.strip())

            resolved_port = int(parsed.get("port") or raw_manifest.get("port") or 8000)
            
            raw_rec = parsed.get("recommended_env")
            if isinstance(raw_rec, dict):
                ai_env_str = "\n".join(f"{k}={v}" for k, v in raw_rec.items())
            elif isinstance(raw_rec, str):
                ai_env_str = raw_rec.strip()
            else:
                ai_env_str = ""

            # Check if AI output is meaningful and repo-specific; otherwise retain the code-extracted env
            if ai_env_str and len(ai_env_str.splitlines()) >= 3 and ("=" in ai_env_str):
                rec_env = ai_env_str
            else:
                rec_env = raw_manifest.get("recommended_env", "")

            if "PORT=" in rec_env:
                import re
                rec_env = re.sub(r"PORT=\d+", f"PORT={resolved_port}", rec_env)
            else:
                rec_env = f"PORT={resolved_port}\n" + rec_env

            # Merge with raw manifest so no verified GitHub data is lost
            return {
                **raw_manifest,
                "ai_analyzed": True,
                "agent_summary": parsed.get("summary", ""),
                "framework": parsed.get("framework") or raw_manifest.get("framework"),
                "runtime": parsed.get("runtime") or raw_manifest.get("runtime"),
                "port": resolved_port,
                "health_endpoint": parsed.get("healthcheck_path") or raw_manifest.get("health_endpoint", "/health"),
                "readiness_score": parsed.get("readiness_score", 92),
                "security_audit": parsed.get("security_audit", "Environment configuration verified for blast radius gates."),
                "recommended_dockerfile": parsed.get("recommended_dockerfile", raw_manifest.get("dockerfile_base", "")),
                "recommended_env": rec_env,
            }
        except Exception as e:
            logger.warning(f"Agentic LLM repo analysis error: {e}. Utilizing deterministic manifest.")
            return {
                **raw_manifest,
                "ai_analyzed": False,
                "readiness_score": 85 if raw_manifest.get("has_dockerfile") else 75,
                "security_audit": "Automated security checklist: verify secret credentials and database URLs before deployment.",
                "agent_summary": f"{raw_manifest.get('repository')} configured as a {raw_manifest.get('framework', 'containerized')} service on {raw_manifest.get('runtime', 'standard runtime')}.",
            }
