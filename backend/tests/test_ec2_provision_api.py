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


def test_stop_and_terminate_ec2_instance():
    # 1. Register a test instance
    reg = client.post("/api/agent/ec2/instances", json={
        "name": "Fleet-Test-Node",
        "public_ip": "198.51.100.42",
        "ssh_user": "ubuntu",
    })
    assert reg.status_code == 200

    # 2. Get instances to find its ID
    insts = client.get("/api/agent/ec2/instances").json()
    test_node = next((i for i in insts if i["public_ip"] == "198.51.100.42"), None)
    assert test_node is not None
    inst_id = test_node["instance_id"]

    # 3. Test stop endpoint
    stop_res = client.post(f"/api/agent/ec2/instances/{inst_id}/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "STOPPING"

    # 4. Test terminate endpoint
    term_res = client.post(f"/api/agent/ec2/instances/{inst_id}/terminate")
    assert term_res.status_code == 200
    assert term_res.json()["status"] in ["TERMINATING", "TERMINATED"]

    # 5. Verify it is removed from active fleet
    after_insts = client.get("/api/agent/ec2/instances?sync=true").json()
    assert not any(i["instance_id"] == inst_id for i in after_insts)
