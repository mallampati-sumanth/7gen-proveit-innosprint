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


def mask_secret(s: Optional[str]) -> str:
    """Returns a safe masked version of a secret token (e.g. verc••••••••1234)."""
    if not s or len(str(s).strip()) < 6:
        return ""
    clean = str(s).strip()
    return f"{clean[:4]}••••••••{clean[-4:]}"


def persist_env_vars(updates: Dict[str, str]):
    """Persists updated configuration keys directly into the root .env file so they survive server restarts."""
    if not updates:
        return
    try:
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
        if not os.path.exists(env_path):
            return
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        remaining_keys = set(updates.keys())
        new_lines = []
        for line in lines:
            line_clean = line.rstrip("\r\n")
            matched = False
            for key, val in updates.items():
                if line_clean.startswith(f"{key}=") or line_clean.startswith(f"#{key}="):
                    new_lines.append(f"{key}={val}\n")
                    remaining_keys.discard(key)
                    matched = True
                    break
            if not matched:
                new_lines.append(line_clean + "\n")

        # Append any new keys not already in the .env file
        for key in remaining_keys:
            val = updates[key]
            new_lines.append(f"{key}={val}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        print(f"[Settings Persist Error] Failed to write to .env: {e}")


class SettingsUpdateRequest(BaseModel):
    cloud_mode: Optional[str] = None
    aws_region: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    github_token: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    sarvam_api_key: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
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
    netlify_token: Optional[str] = None
    multicloud_sandbox_enabled: Optional[bool] = None


@router.get("")
def get_platform_settings() -> Dict[str, Any]:
    """Returns current platform execution, safety gate, and infrastructure parameters."""
    v_tok = settings.VERCEL_TOKEN or os.environ.get("VERCEL_TOKEN")
    n_tok = getattr(settings, "NETLIFY_TOKEN", None) or os.environ.get("NETLIFY_TOKEN")
    r_tok = settings.RENDER_API_KEY or os.environ.get("RENDER_API_KEY")
    rw_tok = settings.RAILWAY_TOKEN or os.environ.get("RAILWAY_TOKEN")
    gh_tok = settings.GITHUB_TOKEN or os.environ.get("GITHUB_TOKEN")

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
        "github_configured": bool(gh_tok),
        "github_preview": mask_secret(gh_tok),
        "aws_configured": bool((settings.AWS_ACCESS_KEY_ID or os.environ.get("AWS_ACCESS_KEY_ID")) and (settings.AWS_SECRET_ACCESS_KEY or os.environ.get("AWS_SECRET_ACCESS_KEY"))),
        "openai_configured": bool(settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")),
        "gemini_configured": bool(settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")),
        "sarvam_configured": bool(settings.SARVAM_API_KEY and not settings.SARVAM_API_KEY.startswith("your_")),
        "sarvam_speaker": settings.SARVAM_SPEAKER,
        "sarvam_language": settings.SARVAM_LANGUAGE_CODE,
        "telephony_agent_phone": settings.TELEPHONY_AGENT_PHONE,
        "vercel_configured": bool(v_tok),
        "vercel_preview": mask_secret(v_tok),
        "render_configured": bool(r_tok),
        "render_preview": mask_secret(r_tok),
        "railway_configured": bool(rw_tok),
        "railway_preview": mask_secret(rw_tok),
        "netlify_configured": bool(n_tok),
        "netlify_preview": mask_secret(n_tok),
    }


@router.post("")
def update_platform_settings(req: SettingsUpdateRequest) -> Dict[str, Any]:
    """Updates runtime platform settings, synchronizes engine config, and persists keys to .env."""
    req_dict = req.model_dump(exclude_unset=True)
    
    for key, value in req_dict.items():
        if key in RUNTIME_SETTINGS:
            RUNTIME_SETTINGS[key] = value

    env_updates: Dict[str, str] = {}

    # Sync corresponding attributes into backend config settings & queue .env updates
    if req.cloud_mode is not None:
        mode = req.cloud_mode.strip().lower()
        settings.CLOUD_MODE = mode
        env_updates["CLOUD_MODE"] = mode

    if req.aws_region is not None:
        reg = req.aws_region.strip()
        settings.AWS_REGION = reg
        env_updates["AWS_REGION"] = reg

    if req.aws_access_key_id is not None:
        key = req.aws_access_key_id.strip()
        settings.AWS_ACCESS_KEY_ID = key
        os.environ["AWS_ACCESS_KEY_ID"] = key
        env_updates["AWS_ACCESS_KEY_ID"] = key

    if req.aws_secret_access_key is not None:
        key = req.aws_secret_access_key.strip()
        settings.AWS_SECRET_ACCESS_KEY = key
        os.environ["AWS_SECRET_ACCESS_KEY"] = key
        env_updates["AWS_SECRET_ACCESS_KEY"] = key

    if req.github_token is not None:
        token = req.github_token.strip()
        settings.GITHUB_TOKEN = token
        os.environ["GITHUB_TOKEN"] = token
        env_updates["GITHUB_TOKEN"] = token

    if req.openai_api_key is not None:
        key = req.openai_api_key.strip()
        settings.OPENAI_API_KEY = key
        os.environ["OPENAI_API_KEY"] = key
        env_updates["OPENAI_API_KEY"] = key

    if req.gemini_api_key is not None:
        key = req.gemini_api_key.strip()
        settings.GEMINI_API_KEY = key
        os.environ["GEMINI_API_KEY"] = key
        env_updates["GEMINI_API_KEY"] = key

    if req.sarvam_api_key is not None:
        key = req.sarvam_api_key.strip()
        settings.SARVAM_API_KEY = key
        os.environ["SARVAM_API_KEY"] = key
        env_updates["SARVAM_API_KEY"] = key

    if req.llm_provider is not None:
        settings.LLM_PROVIDER = req.llm_provider.strip().lower()
        env_updates["LLM_PROVIDER"] = req.llm_provider.strip().lower()

    if req.llm_model is not None:
        model = req.llm_model.strip()
        if settings.LLM_PROVIDER == "openai":
            settings.OPENAI_MODEL = model
            env_updates["OPENAI_MODEL"] = model
        else:
            settings.GEMINI_MODEL = model
            env_updates["GEMINI_MODEL"] = model

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
        env_updates["VERCEL_TOKEN"] = token

    if req.render_api_key is not None:
        key = req.render_api_key.strip()
        settings.RENDER_API_KEY = key
        os.environ["RENDER_API_KEY"] = key
        env_updates["RENDER_API_KEY"] = key

    if req.railway_token is not None:
        token = req.railway_token.strip()
        settings.RAILWAY_TOKEN = token
        os.environ["RAILWAY_TOKEN"] = token
        env_updates["RAILWAY_TOKEN"] = token

    if req.netlify_token is not None:
        token = req.netlify_token.strip()
        settings.NETLIFY_TOKEN = token
        os.environ["NETLIFY_TOKEN"] = token
        env_updates["NETLIFY_TOKEN"] = token

    if req.multicloud_sandbox_enabled is not None:
        settings.MULTICLOUD_SANDBOX_ENABLED = req.multicloud_sandbox_enabled

    # Persist all updated environment variables to .env on disk
    if env_updates:
        persist_env_vars(env_updates)

    return {
        "status": "success",
        "message": f"Platform settings and {len(env_updates)} credentials saved to disk (.env).",
        "persisted_keys": list(env_updates.keys()),
        "settings": get_platform_settings(),
    }
