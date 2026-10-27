import os
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.app.config import settings

router = APIRouter(prefix="/api/settings", tags=["settings"])

# In-memory runtime settings store overriding / supplementing env defaults
RUNTIME_SETTINGS = {
    "cloud_mode": settings.CLOUD_MODE,
    "aws_region": settings.AWS_REGION,
    "default_instance_type": "t3.micro",
    "max_managed_instances": settings.MAX_MANAGED_INSTANCES,
    "chaos_enabled": settings.CHAOS_ENABLED,
    "max_agent_steps": settings.MAX_AGENT_STEPS,
    "blast_radius_strict": True,
    "sandbox_pre_verification": True,
    "auto_rollback_on_failure": True,
    "allowed_ports": [80, 443, 8000, 3000, 5000],
    "max_container_memory_mb": 1024,
    "forbidden_commands": ["rm -rf", "mkfs", "dd", "chmod 777", ":(){ :|:& };:"],
    "webhook_url": "",
    "audit_auto_export": True,
    "require_approval_for_destructive": True,
    "multicloud_sandbox_enabled": True,
}


class SettingsUpdateRequest(BaseModel):
    cloud_mode: Optional[str] = None
    aws_region: Optional[str] = None
    default_instance_type: Optional[str] = None
    max_managed_instances: Optional[int] = None
    chaos_enabled: Optional[bool] = None
    max_agent_steps: Optional[int] = None
    blast_radius_strict: Optional[bool] = None
    sandbox_pre_verification: Optional[bool] = None
    auto_rollback_on_failure: Optional[bool] = None
    allowed_ports: Optional[List[int]] = None
    max_container_memory_mb: Optional[int] = None
    forbidden_commands: Optional[List[str]] = None
    webhook_url: Optional[str] = None
    audit_auto_export: Optional[bool] = None
    require_approval_for_destructive: Optional[bool] = None
    vercel_token: Optional[str] = None
    render_api_key: Optional[str] = None
    railway_token: Optional[str] = None
    multicloud_sandbox_enabled: Optional[bool] = None


@router.get("")
def get_platform_settings() -> Dict[str, Any]:
    """Returns current platform execution, safety gate, and infrastructure parameters."""
    return {
        **RUNTIME_SETTINGS,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": (
            settings.GEMINI_MODEL if settings.LLM_PROVIDER == "gemini" else (
                settings.OPENAI_MODEL if settings.LLM_PROVIDER == "openai" else (
                    settings.ANTHROPIC_MODEL if settings.LLM_PROVIDER == "anthropic" else (
                        settings.GROQ_MODEL if settings.LLM_PROVIDER == "groq" else settings.OLLAMA_MODEL
                    )
                )
            )
        ),
        "sarvam_configured": bool(settings.SARVAM_API_KEY and not settings.SARVAM_API_KEY.startswith("your_")),
        "sarvam_speaker": settings.SARVAM_SPEAKER,
        "sarvam_language": settings.SARVAM_LANGUAGE_CODE,
        "telephony_agent_phone": settings.TELEPHONY_AGENT_PHONE,
        "vercel_configured": bool(settings.VERCEL_TOKEN or os.environ.get("VERCEL_TOKEN")),
        "render_configured": bool(settings.RENDER_API_KEY or os.environ.get("RENDER_API_KEY")),
        "railway_configured": bool(settings.RAILWAY_TOKEN or os.environ.get("RAILWAY_TOKEN")),
    }


@router.post("")
def update_platform_settings(req: SettingsUpdateRequest) -> Dict[str, Any]:
    """Updates runtime platform settings and synchronizes with global engine config."""
    import os
    req_dict = req.model_dump(exclude_unset=True)
    
    for key, value in req_dict.items():
        if key in RUNTIME_SETTINGS:
            RUNTIME_SETTINGS[key] = value

    # Sync corresponding attributes into backend config settings
    if req.cloud_mode is not None:
        settings.CLOUD_MODE = req.cloud_mode.strip().lower()
    if req.aws_region is not None:
        settings.AWS_REGION = req.aws_region.strip()
    if req.chaos_enabled is not None:
        settings.CHAOS_ENABLED = req.chaos_enabled
    if req.max_agent_steps is not None:
        settings.MAX_AGENT_STEPS = req.max_agent_steps
    if req.max_managed_instances is not None:
        settings.MAX_MANAGED_INSTANCES = req.max_managed_instances
    if req.vercel_token is not None:
        token = req.vercel_token.strip()
        settings.VERCEL_TOKEN = token
        os.environ["VERCEL_TOKEN"] = token
    if req.render_api_key is not None:
        key = req.render_api_key.strip()
        settings.RENDER_API_KEY = key
        os.environ["RENDER_API_KEY"] = key
    if req.railway_token is not None:
        token = req.railway_token.strip()
        settings.RAILWAY_TOKEN = token
        os.environ["RAILWAY_TOKEN"] = token
    if req.multicloud_sandbox_enabled is not None:
        settings.MULTICLOUD_SANDBOX_ENABLED = req.multicloud_sandbox_enabled

    return {
        "status": "success",
        "message": "Platform settings updated successfully.",
        "settings": get_platform_settings(),
    }

