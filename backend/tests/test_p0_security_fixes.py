import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.routers.auth import create_access_token
from backend.app.entities.models import User
from backend.app.db import engine, init_db
from sqlmodel import Session, select
import json
import uuid

init_db()
client = TestClient(app)


def test_package_json_does_not_contain_plaintext_token():
    """Verify package.json repository URL does NOT leak GitHub Personal Access Token."""
    with open("package.json", "r", encoding="utf-8") as f:
        pkg = json.load(f)
    repo_url = pkg.get("repository", {}).get("url", "")
    assert "ghp_" not in repo_url
    assert "@github.com" not in repo_url
    assert "github.com/mallampati-sumanth/7gen-proveit-innosprint" in repo_url


def test_unauthenticated_mutating_endpoints_are_blocked():
    """Verify unauthenticated requests to mutating infrastructure endpoints return 401."""
    # 1. POST /api/agent/deploy without token
    res_deploy = client.post("/api/agent/deploy", json={"prompt": "test unauth deploy", "target_repo": "test/repo"})
    assert res_deploy.status_code == 401

    # 2. POST /api/agent/ec2/provision without token
    res_prov = client.post("/api/agent/ec2/provision", json={"name": "hacker-node"})
    assert res_prov.status_code == 401

    # 3. POST /api/agent/ec2/instances/test_id/terminate without token
    res_term = client.post("/api/agent/ec2/instances/i-12345/terminate")
    assert res_term.status_code == 401

    # 4. POST /api/agent/ec2/instances/test_id/stop without token
    res_stop = client.post("/api/agent/ec2/instances/i-12345/stop")
    assert res_stop.status_code == 401

    # 5. POST /api/multicloud/deploy without token
    res_mc = client.post("/api/multicloud/deploy", json={"repo_name": "test/repo", "provider": "render"})
    assert res_mc.status_code == 401

    # 6. POST /api/settings without token
    res_settings = client.post("/api/settings", json={"max_container_memory_mb": 4096})
    assert res_settings.status_code == 401


def test_authenticated_mutating_endpoints_allow_access():
    """Verify authenticated user with valid JWT can access protected endpoints."""
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == "admin")).first()
        token = create_access_token({"sub": user.username, "email": user.email, "uid": user.user_id})

    headers = {"Authorization": f"Bearer {token}"}

    # 1. POST /api/settings with token allows update
    res_settings = client.post("/api/settings", json={"max_container_memory_mb": 1024}, headers=headers)
    assert res_settings.status_code == 200
    assert res_settings.json()["status"] == "success"

    # 2. POST /api/agent/ec2/provision with token allows initiate
    res_prov = client.post("/api/agent/ec2/provision", json={"name": "Test-Auth-Node"}, headers=headers)
    assert res_prov.status_code == 200
    assert "job_id" in res_prov.json()


@pytest.mark.asyncio
async def test_blast_radius_guard_enforced_in_loop():
    """Verify loop.py halts on policy violation if approval is not provided for production deployment."""
    from proveit_model.agent.loop import ProveItAgent

    agent = ProveItAgent(llm_provider="gemini", cloud_mode="mock")
    events = []
    # approved=False explicitly passed
    async for event in agent.execute_run_stream(
        prompt="Deploy to production without approval",
        target_repo="pallets/flask",
        target_ec2="i-0a8f9c12345678",
        environment="production",
        approved=False,
    ):
        events.append(event)

    types = [e.get("type") for e in events]
    assert "RUN_ERROR" in types or "POLICY_VIOLATION" in types
    # Must NOT have deployed or committed to ledger when policy check rejected it
    assert "commit_to_proof_ledger" not in [e.get("tool_name") for e in events if e.get("type") == "TOOL_START"]
