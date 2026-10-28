import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_cors_vercel_preview_and_production_domains():
    origins = [
        "https://proveit-frontend.vercel.app",
        "https://proveit-frontend-git-main-myteam.vercel.app",
        "https://my-custom-deploy-abc123.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    for origin in origins:
        # 1. Test OPTIONS preflight
        res_opt = client.options(
            "/api/settings",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type",
            }
        )
        assert res_opt.status_code == 200, f"Failed OPTIONS preflight for {origin}"
        assert res_opt.headers.get("access-control-allow-origin") == origin, f"Missing CORS header for {origin}"

        # 2. Test GET request
        res_get = client.get("/health", headers={"Origin": origin})
        assert res_get.status_code == 200, f"Failed GET for {origin}"
        assert res_get.headers.get("access-control-allow-origin") == origin, f"Missing CORS header for {origin}"
