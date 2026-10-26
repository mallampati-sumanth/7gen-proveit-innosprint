import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "proveit-backend"
    assert data["cloud_mode"] == settings.CLOUD_MODE


def test_login_demo():
    response = client.post("/api/auth/login", json={
        "username": settings.DEMO_USERNAME,
        "password": settings.DEMO_PASSWORD
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid():
    response = client.post("/api/auth/login", json={
        "username": "wrong_user",
        "password": "wrong_password"
    })
    assert response.status_code == 401
