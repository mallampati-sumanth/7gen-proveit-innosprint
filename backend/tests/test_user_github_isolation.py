import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.routers.auth import create_access_token
from backend.app.entities.models import User
from backend.app.db import engine, init_db
from sqlmodel import Session, select
import uuid

init_db()
client = TestClient(app)


def test_new_user_does_not_inherit_global_github_account():
    """Verify newly registered non-admin user does NOT see global server GITHUB_TOKEN as their GitHub account."""
    with Session(engine) as session:
        # Create a new non-admin user
        new_username = f"testuser_{uuid.uuid4().hex[:8]}"
        user = User(
            user_id=f"usr_{uuid.uuid4().hex[:12]}",
            email=f"{new_username}@test.cloud",
            username=new_username,
            name="Test User",
            is_admin=False,
            is_active=True,
            github_pat=None,
            github_username=None,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Generate JWT for this new user
        token = create_access_token(data={"sub": user.username, "email": user.email, "uid": user.user_id})

        # Query GET /api/agent/github/profile without token query param, but with user's JWT
        res = client.get("/api/agent/github/profile", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        
        # MUST NOT be connected to server's GITHUB_TOKEN (PendelaNagaAbhinay)
        assert data.get("connected") is False or data.get("login") is None or data.get("login") != "PendelaNagaAbhinay"
        assert data.get("connected") is False


def test_user_connects_own_github_pat_isolated():
    """Verify user connecting their own GitHub PAT updates their user model without polluting other users."""
    from unittest.mock import patch

    with Session(engine) as session:
        username = f"isolated_user_{uuid.uuid4().hex[:6]}"
        user = User(
            user_id=f"usr_{uuid.uuid4().hex[:12]}",
            email=f"{username}@mail.com",
            username=username,
            is_admin=False,
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_access_token(data={"sub": user.username, "email": user.email, "uid": user.user_id})

        # Mock GitHub profile for this specific user
        mock_profile = {
            "connected": True,
            "login": "octocat-custom-user",
            "username": "octocat-custom-user",
            "name": "The Custom Octocat",
            "id": 1234567,
            "avatar_url": "https://github.com/images/error/octocat_happy.gif",
            "total_repos": 5,
        }

        with patch("backend.app.routers.agent.github_tools.get_user_profile", return_value=mock_profile), \
             patch("backend.app.routers.agent.github_tools.list_user_repositories", return_value=[]):
            res = client.post(
                "/api/agent/github/connect",
                json={"token": "ghp_mock_token_for_octocat_custom_user"},
                headers={"Authorization": f"Bearer {token}"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "connected"
            assert data["profile"]["login"] == "octocat-custom-user"

        # Verify in database that this specific user record now has encrypted github_pat and github_username
        session.refresh(user)
        assert user.github_username == "octocat-custom-user"
        assert user.github_pat is not None
        assert user.github_pat.startswith("gAAAAA")
