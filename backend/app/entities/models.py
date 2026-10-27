from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


def get_utc_now():
    return datetime.now(timezone.utc)


class Run(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(index=True, unique=True)
    status: str = Field(default="PENDING")  # PENDING, RUNNING, HEALED, ESCALATED, FAILED
    prompt: str
    target_repo: Optional[str] = None
    target_ec2: Optional[str] = None
    environment: str = Field(default="production")
    injected_env_json: Optional[str] = Field(default="{}")
    cloud_mode: str = Field(default="mock")
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(index=True)
    event_type: str  # PLAN, TOOL_CALL, POLICY_VERDICT, PROOF_RESULT, SYSTEM
    summary: str
    details_json: str = Field(default="{}")
    created_at: datetime = Field(default_factory=get_utc_now)


class Incident(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    incident_id: str = Field(index=True, unique=True)
    run_id: str = Field(index=True)
    scenario: str  # WRONG_PORT, MISSING_ENV, BROKEN_BUILD, BAD_HEALTH_PATH, OOM, GATEWAY_502, UNKNOWN
    status: str = Field(default="DETECTED")  # DETECTED, DIAGNOSING, PROVING, HEALED, ESCALATED
    attempts: int = Field(default=0)
    proof_bundle_json: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class Approval(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    approval_id: str = Field(index=True, unique=True)
    run_id: str = Field(index=True)
    tool_name: str
    arguments_json: str
    blast_radius: int
    reasons_json: str
    status: str = Field(default="PENDING")  # PENDING, APPROVED, REJECTED
    created_at: datetime = Field(default_factory=get_utc_now)


class LedgerEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    entry_id: str = Field(index=True, unique=True)
    timestamp: str
    actor: str  # agent, policy, human, system
    action: str
    payload_json: str
    prev_hash: str
    hash: str = Field(index=True)


class BenchmarkResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    benchmark_id: str = Field(index=True)
    mode: str  # BASELINE | PROVEIT
    scenario: str
    iteration: int
    fixed: bool
    time_to_recovery_seconds: float
    policy_violations_detected: int
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)


class RepoConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    repo_id: str = Field(index=True, unique=True)  # e.g. "7gen/react-dashboard"
    repo_name: str
    owner: str = Field(default="7gen")
    description: Optional[str] = None
    clone_url: Optional[str] = None
    default_branch: str = Field(default="main")
    language: str = Field(default="TypeScript")
    framework: Optional[str] = Field(default=None)
    default_port: int = Field(default=3000)
    healthcheck_path: str = Field(default="/health")
    is_connected: bool = Field(default=True)
    last_deployed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class RepoEnvVar(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    repo_id: str = Field(index=True)  # links to RepoConfig.repo_id
    environment: str = Field(default="production", index=True)  # development | staging | production
    key: str = Field(index=True)
    value: str
    category: str = Field(default="APP")  # APP | DATABASE | AWS | AUTH | LOGS | THIRD_PARTY
    is_secret: bool = Field(default=False)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class EC2Instance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    instance_id: str = Field(index=True, unique=True)  # e.g. "i-09ab12cd34ef56"
    name: str = Field(default="Production EC2 Node")
    public_ip: str = Field(default="54.210.14.88")
    private_ip: Optional[str] = Field(default="10.0.1.42")
    region: str = Field(default="us-east-1")
    instance_type: str = Field(default="t3.small")
    state: str = Field(default="running")  # running | stopped | provisioning | error
    ssh_user: str = Field(default="ubuntu")
    auth_method: str = Field(default="ssh_key")  # ssh_key | ssm | password
    ssh_port: int = Field(default=22)
    docker_installed: bool = Field(default=True)
    docker_version: Optional[str] = Field(default="Docker v26.1.4, compose v2.27.0")
    deployed_containers_count: int = Field(default=1)
    deployed_apps_json: Optional[str] = Field(default="[]")
    last_ping_status: str = Field(default="HEALTHY")
    last_ping_latency_ms: float = Field(default=18.4)
    last_ping_at: Optional[datetime] = Field(default_factory=get_utc_now)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    username: str = Field(index=True, unique=True)
    name: Optional[str] = Field(default=None)
    hashed_password: Optional[str] = Field(default=None)
    salt: Optional[str] = Field(default=None)
    auth_provider: str = Field(default="email")  # email | github
    github_id: Optional[str] = Field(default=None, index=True)
    github_username: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    is_admin: bool = Field(default=False)
    # VoiceOps Authentication & Sarvam AI Integration
    phone_number: Optional[str] = Field(default=None, index=True)
    phone_verified: bool = Field(default=False)
    voice_pin: Optional[str] = Field(default="1234")
    voice_enabled: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class VoiceCallLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    call_sid: str = Field(index=True, unique=True)
    caller_phone: str = Field(index=True)
    username: Optional[str] = Field(default=None, index=True)
    pin_verified: bool = Field(default=False)
    transcript: Optional[str] = Field(default=None)
    intent: Optional[str] = Field(default="DEPLOY")
    matched_repo: Optional[str] = Field(default=None)
    deployment_run_id: Optional[str] = Field(default=None)
    agent_response: Optional[str] = Field(default=None)
    status: str = Field(default="COMPLETED")  # RINGING, AUTHENTICATED, COMPLETED, UNAUTHORIZED
    created_at: datetime = Field(default_factory=get_utc_now)


