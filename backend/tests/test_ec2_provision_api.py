import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_provision_endpoint_initiate_and_stream():
    res = client.post("/api/agent/ec2/provision", json={
        "name": "Test-Flask-Host",
        "instance_type": "t3.micro",
        "region": "us-east-1",
        "app_port": 5000,
        "target_repo": "pallets/flask"
    })
    assert res.status_code == 200
    data = res.json()
    assert "job_id" in data
    assert "stream_url" in data
    job_id = data["job_id"]

    # Stream the events
    with client.stream("GET", f"/api/agent/ec2/provision/stream/{job_id}") as stream:
        lines = [line for line in stream.iter_lines() if line.startswith("data: ")]
        assert len(lines) >= 3
        assert "data: " in lines[0]
