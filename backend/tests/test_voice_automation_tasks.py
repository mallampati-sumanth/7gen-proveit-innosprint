import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_voice_automation_tasks_structure():
    res = client.get("/api/voice/automation/tasks?username=AbhinayAmbati")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "active"
    assert "tasks" in data
    assert isinstance(data["tasks"], list)


def test_delete_and_deploy_voice_automation_tasks():
    # 1. Delete all tasks
    del_res = client.delete("/api/voice/automation/tasks")
    assert del_res.status_code == 200

    empty_res = client.get("/api/voice/automation/tasks?username=AbhinayAmbati")
    assert empty_res.status_code == 200
    assert len(empty_res.json()["tasks"]) == 0

    # 2. Deploy app via voice tool
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
    assert "98.84.98.57:8000" in res_data["live_url"] or ":8000" in res_data["live_url"]

    # 3. Verify task tracker displays this deployment cleanly
    tasks_res = client.get("/api/voice/automation/tasks?username=AbhinayAmbati")
    assert tasks_res.status_code == 200
    all_tasks = tasks_res.json()["tasks"]
    assert len(all_tasks) == 1
    assert all_tasks[0]["repo"] == "AbhinayAmbati/campus-climate"
    assert all_tasks[0]["provider"] == "aws"
    assert "98.84.98.57:8000" in all_tasks[0]["live_url"] or ":8000" in all_tasks[0]["live_url"]
    assert all_tasks[0]["status"] in ["LIVE", "SUCCESS"]
    assert "webpilot" not in all_tasks[0]["repo"]
    assert "friday" not in all_tasks[0]["repo"].lower()

    # 4. Clean up after test so database remains completely clean
    del_res2 = client.delete("/api/voice/automation/tasks")
    assert del_res2.status_code == 200
    empty_res2 = client.get("/api/voice/automation/tasks?username=AbhinayAmbati")
    assert len(empty_res2.json()["tasks"]) == 0
