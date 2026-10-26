from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]


class AgentMessage(BaseModel):
    role: str  # user, assistant, system, tool
    content: str
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[AgentMessage],
        tools: Optional[List[ToolDefinition]] = None,
        system_instruction: Optional[str] = None,
    ) -> AgentMessage:
        pass
