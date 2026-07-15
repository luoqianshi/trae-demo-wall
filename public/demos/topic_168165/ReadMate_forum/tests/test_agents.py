"""Agent 层测试"""
import pytest
from readmate.agents import BaseAgent, AgentContext, AgentResult, Orchestrator, SelectionAgent


def test_agent_context():
    """测试 Agent 上下文"""
    ctx = AgentContext(selected_text="test", action="解释")
    assert ctx.selected_text == "test"
    assert ctx.action == "解释"
    assert ctx.custom_question == ""
    assert ctx.conversation_history == []


def test_agent_result():
    """测试 Agent 结果"""
    result = AgentResult(success=True, answer="测试回答")
    assert result.success is True
    assert result.answer == "测试回答"
    assert result.error == ""


def test_orchestrator():
    """测试编排器"""
    orch = Orchestrator()
    orch.register_agent(SelectionAgent())
    ctx = AgentContext(selected_text="test", action="解释")
    agent = orch.select_agent(ctx)
    assert agent is not None
    assert agent.name == "SelectionAgent"
