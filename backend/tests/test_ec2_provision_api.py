import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.routers.auth import create_access_token
from backend.app.config import settings
from backend.app.entities.models import User
from backend.app.db import engine, init_db
from sqlmodel import Session, select

init_db()
client = TestClient(app)

with Session(engine) as session:
    admin_u = session.exec(select(User).where(User.username == settings.DEMO_USERNAME)).first()
    auth_token = create_access_token({"sub": admin_u.username, "email": admin_u.email, "uid": admin_u.user_id}) if admin_u else ""
auth_headers = {"Authorization": f"Bearer {auth_token}"}


def test_provision_endpoint_initiate_and_stream():
    res = client.post("/api/agent/ec2/provision", json={
        "name": "Test-Flask-Host",
        "instance_type": "t3.micro",
        "region": "us-east-1",
        "app_port": 5000,
        "target_repo": "pallets/flask"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "job_id" in data
    assert "stream_url" in data
    job_id = data["job_id"]

    # Stream the events
    with client.stream("GET", f"/api/agent/ec2/provision/stream/{job_id}", headers=auth_headers) as stream:
        lines = [line for line in stream.iter_lines() if line.startswith("data: ")]
        assert len(lines) >= 3
        assert "data: " in lines[0]


def test_stop_and_terminate_ec2_instance():
    # 1. Register a test instance
    reg = client.post("/api/agent/ec2/instances", json={
        "name": "Fleet-Test-Node",
        "public_ip": "198.51.100.42",
        "ssh_user": "ubuntu",
    }, headers=auth_headers)
    assert reg.status_code == 200

    # 2. Get instances to find its ID
    insts = client.get("/api/agent/ec2/instances", headers=auth_headers).json()
    test_node = next((i for i in insts if i["public_ip"] == "198.51.100.42"), None)
    assert test_node is not None
    inst_id = test_node["instance_id"]

    # 3. Test stop endpoint
    stop_res = client.post(f"/api/agent/ec2/instances/{inst_id}/stop", headers=auth_headers)
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "STOPPING"

    # 4. Test terminate endpoint
    term_res = client.post(f"/api/agent/ec2/instances/{inst_id}/terminate", headers=auth_headers)
    assert term_res.status_code == 200
    assert term_res.json()["status"] in ["TERMINATING", "TERMINATED"]

    # 5. Verify it is removed from active fleet
    after_insts = client.get("/api/agent/ec2/instances?sync=true", headers=auth_headers).json()
    assert not any(i["instance_id"] == inst_id for i in after_insts)
