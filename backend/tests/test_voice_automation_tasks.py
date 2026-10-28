import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_voice_automation_tasks():
    res = client.get("/api/voice/automation/tasks?username=AbhinayAmbati")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "active"
    tasks = data["tasks"]
    assert len(tasks) > 0

    # Ensure no dummy mock tasks from SRE or dummy names leak in
    for t in tasks:
        assert t["repo"] != "test-org/fastapi-backend"
        assert t["repo"] != "test-org/landing-page"
        assert t["repo"] != "docker/awesome-compose"
        assert t["repo"] != "facebook/react"
        assert "webpilot" not in t["repo"]
        assert "friday" not in t["repo"].lower()

    # Ensure top task is campus-climate live deployment on AWS EC2
    top = tasks[0]
    assert top["repo"] == "AbhinayAmbati/campus-climate"
    assert top["provider"] == "aws"
    assert top["status"] in ["LIVE", "SUCCESS"]
    assert "http://54.210.14.88:8000" in top["live_url"]
    assert top["proof_hash"] != ""


def test_voice_deploy_ec2_reflection():
    # Verify executing a voice deploy reflects properly in tasks
    payload = {
        "tool_name": "deploy_app",
        "caller_phone": "+91 77998 26164",
        "pin": "7833",
        "arguments": {
            "repo_name": "AbhinayAmbati/campus-climate",
            "provider": "aws",
            "user_confirmed": True,
        }
    }
    res = client.post("/api/voice/agent/execute-tool", json=payload)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "SUCCESS"
    assert "54.210.14.88:8000" in res_data["live_url"]

    # Verify task tracker displays this deployment
    tasks_res = client.get("/api/voice/automation/tasks?username=AbhinayAmbati")
    assert tasks_res.status_code == 200
    all_tasks = tasks_res.json()["tasks"]
    assert len(all_tasks) > 0
    assert all_tasks[0]["repo"] == "AbhinayAmbati/campus-climate"
    assert all_tasks[0]["provider"] == "aws"
    assert "54.210.14.88:8000" in all_tasks[0]["live_url"]
    assert all_tasks[0]["status"] == "LIVE"
