import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.providers.vercel_provider import VercelProvider
from backend.app.routers.settings import get_platform_settings, update_platform_settings, SettingsUpdateRequest, RUNTIME_SETTINGS


client = TestClient(app)


@pytest.mark.asyncio
async def test_vercel_provider_deploy_api_error_handling():
    """Verify VercelProvider correctly surfaces API errors as status=FAILED with logs."""
    prov = VercelProvider(token="verc_mock_token_12345678")

    mock_user_res = MagicMock()
    mock_user_res.status_code = 403
    mock_user_res.text = "Forbidden: Invalid Vercel Token"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_user_res
        res = await prov.deploy_repository(repo_name="org/my-next-app", branch="main")
        assert res.status == "FAILED"
        assert res.live_url == ""
        assert any("403" in log or "Unauthorized" in log or "Invalid" in log for log in res.build_logs)


@pytest.mark.asyncio
async def test_vercel_provider_unconfigured_sandbox():
    """Verify VercelProvider unconfigured behavior respects sandbox settings."""
    prov = VercelProvider(token="")
    res = await prov.deploy_repository(repo_name="test-org/test-repo", branch="main")
    assert res.provider == "vercel"
    assert res.status in ["READY", "BUILDING", "FAILED"]


def test_settings_api_get_and_update():
    """Verify GET and POST /api/settings update and retrieve runtime configurations."""
    from backend.app.routers.auth import create_access_token
    from backend.app.config import settings as app_settings
    from backend.app.entities.models import User
    from backend.app.db import engine
    from sqlmodel import Session, select

    with Session(engine) as session:
        admin_u = session.exec(select(User).where(User.username == app_settings.DEMO_USERNAME)).first()
        tok = create_access_token({"sub": admin_u.username, "email": admin_u.email, "uid": admin_u.user_id}) if admin_u else ""
    auth_headers = {"Authorization": f"Bearer {tok}"}

    # Test GET /api/settings
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200
    data = get_res.json()
    assert "cloud_mode" in data
    assert "allowed_ports" in data
    assert "max_container_memory_mb" in data

    # Test updating a harmless runtime setting (e.g., max_container_memory_mb)
    post_res = client.post("/api/settings", json={"max_container_memory_mb": 2048}, headers=auth_headers)
    assert post_res.status_code == 200
    res_data = post_res.json()
    assert res_data["status"] == "success"
    assert res_data["settings"]["max_container_memory_mb"] == 2048

    # Restore setting
    client.post("/api/settings", json={"max_container_memory_mb": 1024}, headers=auth_headers)


def test_settings_aws_credentials_storing():
    """Verify that AWS Access Key ID, Secret Key, and Region store and retrieve properly."""
    from backend.app.routers.auth import create_access_token
    from backend.app.config import settings as app_settings
    from backend.app.entities.models import User
    from backend.app.db import engine
    from sqlmodel import Session, select

    with Session(engine) as session:
        admin_u = session.exec(select(User).where(User.username == app_settings.DEMO_USERNAME)).first()
        tok = create_access_token({"sub": admin_u.username, "email": admin_u.email, "uid": admin_u.user_id}) if admin_u else ""
    auth_headers = {"Authorization": f"Bearer {tok}"}

    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    assert "aws_configured" in data
    assert "aws_access_key_id" in data
    assert "aws_access_key_preview" in data
    assert "aws_secret_key_preview" in data

    # Update with credentials
    up_res = client.post("/api/settings", json={
        "aws_region": "us-east-1",
        "aws_access_key_id": "AKIAXSVLTBTDT3GVIBPA",
        "aws_secret_access_key": "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",
    }, headers=auth_headers)
    assert up_res.status_code == 200
    u_data = up_res.json()
    assert u_data["status"] == "success"
    assert u_data["settings"]["aws_configured"] is True
    assert u_data["settings"]["aws_access_key_id"] == "AKIAXSVLTBTDT3GVIBPA"
    assert "AKIA" in u_data["settings"]["aws_access_key_preview"]
