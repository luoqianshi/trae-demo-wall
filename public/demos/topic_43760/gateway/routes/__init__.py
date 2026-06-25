"""
Gateway route modules.
"""

from .agent import router as agent_router
from .session import router as session_router
from .file import router as file_router
from .git import router as git_router
from .terminal import router as terminal_router
from .task import router as task_router
from .system import router as system_router
from .agent_memory import router as memory_router

__all__ = [
    "agent_router",
    "session_router",
    "file_router",
    "git_router",
    "terminal_router",
    "task_router",
    "system_router",
    "memory_router",
]
