import pytest
import os
from unittest.mock import MagicMock
from sqlmodel import Session, select
from backend.app.db import engine, get_session
from backend.app.config import settings
from backend.app.entities.models import Run, RepoConfig, RepoEnvVar
from backend.app.routers.settings import get_platform_settings, RUNTIME_SETTINGS


def test_sqlite_wal_and_busy_timeout():
    """Verify SQLite engine has WAL journal mode and busy timeout configured to prevent lock contention."""
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            mode = conn.exec_driver_sql("PRAGMA journal_mode;").scalar()
            timeout = conn.exec_driver_sql("PRAGMA busy_timeout;").scalar()
            assert str(mode).lower() == "wal"
            assert int(timeout) >= 5000


def test_secret_encryption_roundtrip():
    """Verify repo secret encryption encrypts at rest and decrypts transparently."""
    from backend.app.routers.agent import encrypt_secret, decrypt_secret

    raw_secret = "postgres://admin:top_secret_pass_2026@cluster.aws.internal:5432/app"
    encrypted = encrypt_secret(raw_secret)
    assert encrypted != raw_secret
    assert encrypted.startswith("gAAAAA")

    decrypted = decrypt_secret(encrypted)
    assert decrypted == raw_secret

    # Verify legacy plaintext values are returned untouched (backward compatibility)
    plain_val = "standard_plaintext_variable_value"
    assert decrypt_secret(plain_val) == plain_val


def test_repo_env_var_transparent_storage():
    """Verify RepoEnvVar saves secret encrypted and reads decrypted in API."""
    from backend.app.routers.agent import get_repository_env, save_repository_env, SaveRepoEnvRequest

    with Session(engine) as session:
        test_repo = "7gen-test/crypto-vault-repo"
        # Clean up any existing test records
        for v in session.exec(select(RepoEnvVar).where(RepoEnvVar.repo_id == test_repo)).all():
            session.delete(v)
        session.commit()

        # Save variable marked as secret
        save_req = SaveRepoEnvRequest(
            environment="production",
            variables=[
                {"key": "DB_PASSWORD", "value": "super_secret_db_pass_123", "category": "DATABASE", "secret": True},
                {"key": "APP_PORT", "value": "8080", "category": "APP", "secret": False},
            ]
        )
        save_repository_env(test_repo, save_req, session)

        # Inspect database record directly: DB_PASSWORD must be stored encrypted
        db_records = session.exec(select(RepoEnvVar).where(RepoEnvVar.repo_id == test_repo)).all()
        db_map = {r.key: r.value for r in db_records}
        assert db_map["APP_PORT"] == "8080"
        assert db_map["DB_PASSWORD"].startswith("gAAAAA")

        # Query via API function: value must be returned decrypted to caller
        res = get_repository_env(test_repo, "production", session)
        api_map = {v["key"]: v["value"] for v in res["variables"]}
        assert api_map["APP_PORT"] == "8080"
        assert api_map["DB_PASSWORD"] == "super_secret_db_pass_123"


def test_models_optional_user_id():
    """Verify Run and RepoConfig models support optional user_id for multi-tenant awareness."""
    run = Run(
        run_id="run_test_user_id_001",
        prompt="Deploy test app",
        target_repo="user1/my-app",
        user_id="usr_abc12345",
    )
    assert run.user_id == "usr_abc12345"

    repo = RepoConfig(
        repo_id="user1/my-app",
        repo_name="my-app",
        owner="user1",
        user_id="usr_abc12345",
    )
    assert repo.user_id == "usr_abc12345"


def test_platform_settings_dynamic_sync():
    """Verify get_platform_settings reflects active config parameters."""
    cfg = get_platform_settings()
    assert "cloud_mode" in cfg
    assert "multicloud_sandbox_enabled" in cfg
    assert isinstance(cfg["allowed_ports"], list)
