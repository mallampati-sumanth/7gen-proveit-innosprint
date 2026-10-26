import sys
sys.path.insert(0, "model")
import pytest
from proveit_model.tools.aws_tools import AWSTools


def test_generate_deploy_key_pair():
    tools = AWSTools(region="us-east-1", mock_mode=True)
    keys = tools.generate_deploy_key_pair()
    assert "public_key" in keys
    assert "private_key" in keys
    assert keys["public_key"].startswith("ssh-rsa") or keys["public_key"].startswith("ssh-ed25519")
    assert "-----BEGIN" in keys["private_key"]


def test_provision_recommended_ec2_mock():
    tools = AWSTools(region="us-east-1", mock_mode=True)
    res = tools.provision_recommended_ec2(
        name="Test-Flask-Host",
        instance_type="t3.micro",
        region="us-east-1",
        app_port=5000,
    )
    assert res["status"] == "PROVISIONED"
    assert res["instance_type"] == "t3.micro"
    assert "public_ip" in res
    assert "instance_id" in res
    assert res["app_port"] == 5000
    assert "deploy_private_key" in res
