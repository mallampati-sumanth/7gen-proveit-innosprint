import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.providers.render_provider import RenderProvider
from backend.app.providers.netlify_provider import NetlifyProvider
from backend.app.providers.railway_provider import RailwayProvider
from backend.app.routers.auth import hash_password, verify_password, generate_salt
import hashlib


client = TestClient(app)


def test_multicloud_status_endpoints_distinction():
    """Verify both /api/multicloud/status and /api/multicloud/status/{provider}/{id} work without name collision."""
    # 1. Query parameter version
    res1 = client.get("/api/multicloud/status", params={"provider": "render", "deployment_id": "test_dep_123"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert "status" in data1

    # 2. Path parameter version
    res2 = client.get("/api/multicloud/status/render/test_dep_123")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["provider"] == "render"
    assert data2["deployment_id"] == "test_dep_123"


@pytest.mark.asyncio
async def test_render_provider_empty_deploy_list():
    """Verify RenderProvider does not crash with AttributeError when Render API returns an empty list []."""
    prov = RenderProvider(api_key="rnd_test_mock_key_12345")
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = []  # Empty deploy list

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        # Must not raise AttributeError
        res = await prov.get_deployment_status("dep_123")
        assert res.provider == "render"
        assert res.status in ["READY", "BUILDING", "FAILED"]


def test_password_hashing_pbkdf2_and_backward_compatibility():
    """Verify PBKDF2 hashing works and maintains backward compatibility with legacy SHA-256 hashes."""
    salt = generate_salt()
    raw_password = "super_secret_test_pass_2026"

    # New PBKDF2 hash
    new_hash = hash_password(raw_password, salt)
    assert verify_password(raw_password, salt, new_hash) is True
    assert verify_password("wrong_password", salt, new_hash) is False

    # Legacy SHA-256 hash (simulating existing user in database)
    legacy_hash = hashlib.sha256((salt + raw_password).encode("utf-8")).hexdigest()
    assert verify_password(raw_password, salt, legacy_hash) is True
    assert verify_password("wrong_password", salt, legacy_hash) is False


def test_voice_webhook_invalid_user_id():
    """Verify voice webhook endpoints handle missing or invalid user_id query params gracefully without 500 crash."""
    # Missing / non-numeric user_id on /api/voice/webhook/verify-pin
    res1 = client.post("/api/voice/webhook/verify-pin?user_id=invalid_non_int", data={"Digits": "1234"})
    assert res1.status_code in [200, 400]
    assert "<Response>" in res1.text

    # Missing / non-numeric user_id on /api/voice/webhook/process-speech
    res2 = client.post("/api/voice/webhook/process-speech?user_id=999999999", data={"SpeechResult": "flask"})
    assert res2.status_code in [200, 400]
    assert "<Response>" in res2.text


@pytest.mark.asyncio
async def test_netlify_provider_fails_on_api_error():
    """Verify NetlifyProvider returns status=FAILED when configured API returns an error instead of fake READY."""
    prov = NetlifyProvider(token="nfp_test_mock_token_12345678")
    
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.headers = {"Content-Type": "application/json"}
    mock_response.json.return_value = {"message": "Unauthorized token"}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        res = await prov.deploy_repository(repo_name="org/myrepo", branch="main")
        assert res.status == "FAILED"
        assert res.live_url == ""
        assert any("401" in log or "Unauthorized" in log for log in res.build_logs)


@pytest.mark.asyncio
async def test_railway_provider_fails_on_api_error():
    """Verify RailwayProvider returns status=FAILED when configured API returns an error instead of fake READY."""
    prov = RailwayProvider(token="rw_test_mock_token_12345678")

    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.headers = {"Content-Type": "application/json"}
    mock_response.json.return_value = {"errors": [{"message": "Internal GraphQL failure"}]}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        res = await prov.deploy_repository(repo_name="org/myrepo", branch="main")
        assert res.status == "FAILED"
        assert res.live_url == ""


def test_repos_endpoint_and_cors_headers():
    """Verify /api/agent/repos and /api/agent/github/connect respond with CORS headers without 500 schema error."""
    # GET /api/agent/repos
    res = client.get("/api/agent/repos", headers={"Origin": "http://localhost:3000"})
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"
    data = res.json()
    assert isinstance(data, list)

    # POST /api/agent/github/connect
    res2 = client.post("/api/agent/github/connect", json={"token": "invalid_test_token"}, headers={"Origin": "http://localhost:3000"})
    assert res2.status_code in [400, 401]
    assert res2.headers.get("access-control-allow-origin") == "http://localhost:3000"
