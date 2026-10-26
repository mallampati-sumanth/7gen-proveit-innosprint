from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Run(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(index=True, unique=True)
    status: str = Field(default="PENDING")  # PENDING, RUNNING, HEALED, ESCALATED, FAILED
    prompt: str
    target_repo: Optional[str] = None
    cloud_mode: str = Field(default="mock")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: str = Field(index=True)
    event_type: str  # PLAN, TOOL_CALL, POLICY_VERDICT, PROOF_RESULT, SYSTEM
    summary: str
    details_json: str = Field(default="{}")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Incident(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    incident_id: str = Field(index=True, unique=True)
    run_id: str = Field(index=True)
    scenario: str  # WRONG_PORT, MISSING_ENV, BROKEN_BUILD, BAD_HEALTH_PATH, OOM, GATEWAY_502, UNKNOWN
    status: str = Field(default="DETECTED")  # DETECTED, DIAGNOSING, PROVING, HEALED, ESCALATED
    attempts: int = Field(default=0)
    proof_bundle_json: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Approval(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    approval_id: str = Field(index=True, unique=True)
    run_id: str = Field(index=True)
    tool_name: str
    arguments_json: str
    blast_radius: int
    reasons_json: str
    status: str = Field(default="PENDING")  # PENDING, APPROVED, REJECTED
    created_at: datetime = Field(default_factory=datetime.utcnow)


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
    created_at: datetime = Field(default_factory=datetime.utcnow)
