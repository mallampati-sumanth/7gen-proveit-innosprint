import sys
sys.path.insert(0, "model")
import pytest
from proveit_model.guards.blast_radius import BlastRadiusGuard
from proveit_model.agent.tools_registry import get_agent_tools_definitions, ToolExecutor
from proveit_model.tools.github_tools import GitHubTools
from proveit_model.tools.aws_tools import AWSTools
from proveit_model.agent.analyzer_agent import RepoAnalyzerAgent
from proveit_model.agent.loop import ProveItAgent
from proveit_model.providers.base import BaseLLMProvider, AgentMessage


class MockLLMProvider(BaseLLMProvider):
    async def generate_response(self, messages, tools=None, system_instruction=None, **kwargs):
        return AgentMessage(
            role="assistant",
            content="Plan: Inspect repository, verify environment variables, execute host handshake, check security blast radius, deploy container, and probe health.",
        )


def test_blast_radius_safe_action():
    guard = BlastRadiusGuard()
    verdict = guard.evaluate(action="inspect_repo", environment="staging")
    assert verdict.allowed is True
    assert verdict.requires_approval is False
    assert verdict.blast_radius < 50


def test_blast_radius_destructive_action():
    guard = BlastRadiusGuard()
    verdict = guard.evaluate(action="terminate_ec2_instance", environment="production")
    # 10 + 25 (prod) + 40 (destruct) = 75 >= 50
    assert verdict.blast_radius >= 50
    assert verdict.requires_approval is True
    assert verdict.allowed is False


def test_blast_radius_approved_override():
    guard = BlastRadiusGuard()
    verdict = guard.evaluate(action="terminate_ec2_instance", environment="production", parameters={"approved": True})
    assert verdict.blast_radius >= 50
    assert verdict.requires_approval is True
    assert verdict.allowed is True


def test_tools_registry_definitions():
    tools = get_agent_tools_definitions()
    tool_names = [d.name for d in tools]
    assert "inspect_repository" in tool_names
    assert "deploy_to_ec2_instance" in tool_names
    assert "verify_ec2_health_probe" in tool_names
    assert "commit_to_proof_ledger" in tool_names


@pytest.mark.asyncio
async def test_tools_registry_execution():
    provider = MockLLMProvider()
    github = GitHubTools()
    aws = AWSTools(region="us-east-1", mock_mode=True)
    guard = BlastRadiusGuard()
    analyzer = RepoAnalyzerAgent(provider=provider)
    executor = ToolExecutor(github=github, aws=aws, guard=guard, analyzer=analyzer)

    res = await executor.execute_tool(
        tool_name="inspect_repository",
        arguments={"repo_url": "pallets/flask"},
        context={"target_repo": "pallets/flask"},
    )
    assert res is not None
    assert "framework" in res or "runtime" in res or "repository" in res


@pytest.mark.asyncio
async def test_autonomous_react_loop_streaming():
    agent = ProveItAgent(cloud_mode="mock", llm_provider="groq")
    agent.provider = MockLLMProvider()
    agent.analyzer.provider = MockLLMProvider()
    
    events = []
    async for event in agent.execute_run_stream(
        prompt="Deploy pallets/flask to EC2 in staging",
        target_repo="pallets/flask",
        target_ec2="i-0a8f9c12345678 (54.210.14.88)",
        environment="staging",
    ):
        events.append(event)
    
    event_types = [e["type"] for e in events]
    assert "RUN_START" in event_types
    assert "TOOL_START" in event_types
    assert "TOOL_RESULT" in event_types
    assert "RUN_COMPLETE" in event_types

    complete_event = next(e for e in events if e["type"] == "RUN_COMPLETE")
    assert complete_event["summary"]["status"] == "PROVEN"
    assert "proof_hash" in complete_event["summary"]
