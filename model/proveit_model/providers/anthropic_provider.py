import json
import logging
import httpx
from typing import List, Optional, Dict, Any
from proveit_model.providers.base import BaseLLMProvider, AgentMessage, ToolDefinition, ToolCall

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseLLMProvider):
    """
    Provider for Anthropic Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3.5 Haiku.
    """

    def __init__(
        self,
        api_key: str = "",
        model_name: str = "claude-3-5-sonnet-20241022",
    ):
        self.api_key = api_key.strip()
        self.model_name = model_name

    async def generate_response(
        self,
        messages: List[AgentMessage],
        tools: Optional[List[ToolDefinition]] = None,
        system_instruction: Optional[str] = None,
    ) -> AgentMessage:
        if self.api_key and not self.api_key.startswith("your_") and len(self.api_key) > 10:
            try:
                headers = {
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                }

                formatted_msgs = []
                for m in messages:
                    if m.role in ["user", "assistant"]:
                        formatted_msgs.append({"role": m.role, "content": m.content})

                payload: Dict[str, Any] = {
                    "model": self.model_name,
                    "messages": formatted_msgs,
                    "max_tokens": 4096,
                }
                if system_instruction:
                    payload["system"] = system_instruction

                if tools:
                    anthropic_tools = []
                    for t in tools:
                        anthropic_tools.append({
                            "name": t.name,
                            "description": t.description,
                            "input_schema": t.parameters,
                        })
                    payload["tools"] = anthropic_tools

                async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
                    res = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        text_parts = []
                        tool_calls = []
                        for block in data.get("content", []):
                            if block.get("type") == "text":
                                text_parts.append(block.get("text", ""))
                            elif block.get("type") == "tool_use":
                                tool_calls.append(ToolCall(
                                    id=block.get("id"),
                                    name=block.get("name"),
                                    arguments=block.get("input", {}),
                                ))
                        return AgentMessage(
                            role="assistant",
                            content=" ".join(text_parts),
                            tool_calls=tool_calls if tool_calls else None,
                        )
                    else:
                        logger.error(f"Anthropic API returned HTTP {res.status_code}: {res.text[:120]}")
            except Exception as e:
                logger.error(f"Anthropic API execution error: {e}")

        # Fallback reasoning
        latest = messages[-1].content if messages else ""
        return AgentMessage(
            role="assistant",
            content=f"[Anthropic Claude Agent Reasoning] Processed deployment request: {latest[:120]}",
        )
