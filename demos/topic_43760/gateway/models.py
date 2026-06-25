"""
Shared data models for Agent Everywhere gateway.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class SessionState:
    """A user-visible agent session that can survive client reconnects."""
    id: str
    title: str
    agent: str
    cwd: str
    created_at: float
    updated_at: float
    status: str = "idle"
    messages: list[dict] = field(default_factory=list)


@dataclass
class AgentTask:
    """Runtime status for an agent execution."""
    id: str
    session_id: str
    agent: str
    prompt: str
    cwd: str
    status: str
    started_at: float
    finished_at: Optional[float] = None
    error: Optional[str] = None
    output: str = ""
