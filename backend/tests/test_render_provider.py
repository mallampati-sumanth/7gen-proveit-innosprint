import pytest
import os
from unittest.mock import patch, MagicMock, AsyncMock
import httpx
from backend.app.providers.render_provider import RenderProvider


@pytest.mark.asyncio
async def test_render_provider_unconfigured():
    provider = RenderProvider(api_key="")
    assert await provider.is_configured() is False

    res = await provider.deploy_repository(
        repo_name="mallampati-sumanth/campus-climate",
        branch="main",
        env_vars={"CUSTOM_VAR": "value123"},
    )
    assert res.provider == "render"
    assert res.status == "READY"
    assert "campus-climate" in res.live_url
    # Verify dynamic detection happened (FastAPI / Python)
    assert any("FastAPI" in log or "Python" in log for log in res.build_logs)
    assert any("uvicorn" in log or "Python" in log for log in res.build_logs)


@pytest.mark.asyncio
async def test_render_specs_resolution():
    provider = RenderProvider()
    
    # Test Python FastAPI
    py_specs = provider._resolve_render_specs(
        repo_name="org/my-fastapi",
        inspection={"runtime": "Python 3.11+", "framework": "FastAPI + Uvicorn ASGI", "port": 8000},
    )
    assert py_specs["env"] == "python"
    assert "uvicorn" in py_specs["startCommand"]
    assert py_specs["port"] == 8000

    # Test Node Next.js
    node_specs = provider._resolve_render_specs(
        repo_name="org/my-next",
        inspection={"runtime": "Node.js 20", "framework": "Next.js 14 App Router", "port": 3000, "scripts": {"build": "next build", "start": "next start"}},
    )
    assert node_specs["env"] == "node"
    assert "npm start" in node_specs["startCommand"]
    assert "npm install && npm run build" in node_specs["buildCommand"]

    # Test Docker
    docker_specs = provider._resolve_render_specs(
        repo_name="org/my-docker-app",
        inspection={"runtime": "Other", "framework": "Generic Container", "has_dockerfile": True, "port": 8080},
    )
    assert docker_specs["env"] == "docker"
    assert docker_specs["buildCommand"] is None
    assert docker_specs["startCommand"] is None


@pytest.mark.asyncio
async def test_render_live_api_auth_error():
    # Live API key with simulated 401 unauthorized
    provider = RenderProvider(api_key="rnd_test_invalid_token_123456789")
    assert await provider.is_configured() is True

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Unauthorized: Invalid API key"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = await provider.deploy_repository(
            repo_name="test-org/test-repo",
            branch="main",
        )
        assert res.status == "FAILED"
        assert any("Render Auth Error" in log for log in res.build_logs)


@pytest.mark.asyncio
async def test_render_live_api_create_success():
    provider = RenderProvider(api_key="rnd_real_mock_key_1234567890123")
    assert await provider.is_configured() is True

    # 1. Mock owners
    owners_resp = MagicMock()
    owners_resp.status_code = 200
    owners_resp.json.return_value = [{"owner": {"id": "usr-test1234", "name": "Test User", "email": "test@proveit.dev"}}]

    # 2. Mock list services (empty)
    list_resp = MagicMock()
    list_resp.status_code = 200
    list_resp.json.return_value = []

    # 3. Mock create service
    create_resp = MagicMock()
    create_resp.status_code = 201
    create_resp.json.return_value = {
        "service": {
            "id": "srv-real9988",
            "name": "campus-climate",
            "serviceDetails": {
                "url": "https://campus-climate.onrender.com",
            }
        }
    }

    # 4. Mock deploys list
    deploys_resp = MagicMock()
    deploys_resp.status_code = 200
    deploys_resp.json.return_value = [{"deploy": {"id": "dep-998877", "status": "live"}}]

    async def mock_get(url, *args, **kwargs):
        if "/owners" in url:
            return owners_resp
        if "/services?limit=100" in url:
            return list_resp
        if "/deploys?limit=1" in url:
            return deploys_resp
        return MagicMock(status_code=404)

    async def mock_post(url, *args, **kwargs):
        if "/services" in url:
            return create_resp
        return MagicMock(status_code=404)

    with patch("httpx.AsyncClient.get", side_effect=mock_get), \
         patch("httpx.AsyncClient.post", side_effect=mock_post):
        res = await provider.deploy_repository(
            repo_name="mallampati-sumanth/campus-climate",
            branch="main",
            env_vars={"DATABASE_URL": "postgres://localhost:5432/db"},
        )
        assert res.status == "READY"
        assert res.live_url == "https://campus-climate.onrender.com"
        assert res.metadata.get("real_api") is True
        assert res.metadata.get("service_id") == "srv-real9988"
        assert res.metadata.get("deploy_id") == "dep-998877"
