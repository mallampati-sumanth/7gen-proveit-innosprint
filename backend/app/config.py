import os
import json
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    # Supabase / Database
    # Supports postgresql:// or sqlite:///
    DATABASE_URL: str = "sqlite:///./proveit.db"
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None

    # Hackathon Demo Auth
    DEMO_USERNAME: str = "admin"
    DEMO_PASSWORD: str = "proveit_demo_secret_2026"
    JWT_SECRET: str = "super_secret_jwt_key_proveit_hackathon_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 120

    # Cloud Mode: mock | aws
    CLOUD_MODE: str = "mock"
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: Optional[str] = None
    AWS_ACCOUNT_ID: Optional[str] = None
    AWS_ECR_REGISTRY: Optional[str] = None
    AWS_ECS_CLUSTER: str = "proveit-cluster"
    AWS_S3_BUCKET: Optional[str] = None
    ALLOWED_REGIONS: List[str] = ["us-east-1", "us-west-2"]
    ALLOWED_INSTANCE_TYPES: List[str] = ["t3.micro", "t3.small"]
    MAX_MANAGED_INSTANCES: int = 2

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # gemini | openai | anthropic | groq | ollama
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_BASE_URL: Optional[str] = None
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    MAX_AGENT_STEPS: int = 25

    # Chaos & GitHub Integration
    CHAOS_ENABLED: bool = True
    GITHUB_TOKEN: str = ""
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_WEBHOOK_SECRET: Optional[str] = None
    GITHUB_DEFAULT_ORG: str = "7gen-engineering"
    PROVEIT_BOT_NAME: str = "proveit-bot"

    # Observability & Log Connection
    CLOUDWATCH_LOG_GROUP: str = "/aws/proveit/deployments"
    CLOUDWATCH_STREAM_NAME: str = "agent-stream"
    SENTRY_DSN: Optional[str] = None
    DATADOG_API_KEY: Optional[str] = None

    # Sarvam AI Voice Agent & Telephony Settings
    SARVAM_API_KEY: str = ""
    SARVAM_VOICE_MODEL: str = "bulbul:v1"
    SARVAM_SPEAKER: str = "meera"
    SARVAM_STT_MODEL: str = "saaras:v1"
    SARVAM_LANGUAGE_CODE: str = "en-IN"
    TELEPHONY_AGENT_PHONE: str = "+91 80 4736 1820"
    TELEPHONY_WEBHOOK_BASE_URL: Optional[str] = "http://localhost:8000"

    # Multi-Cloud Providers (Vercel, Render, Railway)
    VERCEL_TOKEN: Optional[str] = None
    RENDER_API_KEY: Optional[str] = None
    RAILWAY_TOKEN: Optional[str] = None
    MULTICLOUD_SANDBOX_ENABLED: bool = True

    @field_validator("CORS_ORIGINS", "ALLOWED_REGIONS", "ALLOWED_INSTANCE_TYPES", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [item.strip() for item in v.split(",") if item.strip()]
        return v


settings = Settings()

# Synchronize critical secrets to os.environ so boto3 and other sub-libraries discover them reliably
if settings.AWS_ACCESS_KEY_ID:
    os.environ["AWS_ACCESS_KEY_ID"] = settings.AWS_ACCESS_KEY_ID
if settings.AWS_SECRET_ACCESS_KEY:
    os.environ["AWS_SECRET_ACCESS_KEY"] = settings.AWS_SECRET_ACCESS_KEY
if settings.AWS_SESSION_TOKEN and not settings.AWS_SESSION_TOKEN.startswith("optional_"):
    os.environ["AWS_SESSION_TOKEN"] = settings.AWS_SESSION_TOKEN
elif "AWS_SESSION_TOKEN" in os.environ:
    del os.environ["AWS_SESSION_TOKEN"]
if settings.AWS_REGION:
    os.environ["AWS_DEFAULT_REGION"] = settings.AWS_REGION
    os.environ["AWS_REGION"] = settings.AWS_REGION
if settings.VERCEL_TOKEN:
    os.environ["VERCEL_TOKEN"] = settings.VERCEL_TOKEN
if settings.RENDER_API_KEY:
    os.environ["RENDER_API_KEY"] = settings.RENDER_API_KEY
if settings.RAILWAY_TOKEN:
    os.environ["RAILWAY_TOKEN"] = settings.RAILWAY_TOKEN

