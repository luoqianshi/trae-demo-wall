"""
Agent memory and native session routes.
"""

import json
import os
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Header

router = APIRouter(prefix="/api", tags=["agent-memory"])


@router.get("/agent/sessions")
async def list_agent_sessions(authorization: Optional[str] = Header(default=None), agent: str = "claude"):
    """List native sessions for Claude Code or Codex from their local data."""
    router.state.check_auth(authorization)
    sessions = []
    home = Path.home()

    if agent == "claude":
        claude_dir = home / ".claude" / "projects"
        if claude_dir.exists():
            for project_dir in claude_dir.iterdir():
                if not project_dir.is_dir():
                    continue
                for session_file in sorted(project_dir.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True):
                    try:
                        data = json.loads(session_file.read_text(encoding='utf-8', errors='replace'))
                        sessions.append({
                            "id": session_file.stem,
                            "agent": "claude",
                            "project": project_dir.name,
                            "title": data.get("sessionName") or data.get("summary", "")[:60] or session_file.stem[:12],
                            "lastActive": session_file.stat().st_mtime,
                            "path": str(session_file),
                        })
                    except Exception:
                        continue
                    if len(sessions) >= 50:
                        break

    elif agent == "codex":
        codex_dir = home / ".codex" / "sessions"
        if codex_dir.exists():
            for session_file in sorted(codex_dir.iterdir(), key=lambda f: f.stat().st_mtime, reverse=True):
                if not session_file.is_file():
                    continue
                try:
                    data = json.loads(session_file.read_text(encoding='utf-8', errors='replace'))
                    sessions.append({
                        "id": session_file.stem,
                        "agent": "codex",
                        "project": data.get("cwd", "") or "",
                        "title": data.get("title", "")[:60] or session_file.stem[:12],
                        "lastActive": session_file.stat().st_mtime,
                        "path": str(session_file),
                    })
                except Exception:
                    continue
                if len(sessions) >= 50:
                    break

    return {"sessions": sessions}


@router.get("/agent/memory")
async def get_agent_memory(
    authorization: Optional[str] = Header(default=None),
    agent: str = "claude",
    cwd: str = "",
):
    """Read agent memory files: CLAUDE.md (project) + ~/.claude/ (global)."""
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    memories = []

    if agent == "claude":
        project_memories = []
        current = Path(base)
        while True:
            for name in ["CLAUDE.md", "claude.md", ".claude.md"]:
                md_file = current / name
                if md_file.exists():
                    try:
                        content = md_file.read_text(encoding='utf-8', errors='replace')
                        project_memories.append({
                            "name": name,
                            "path": str(md_file),
                            "scope": "project",
                            "content": content,
                        })
                    except Exception:
                        pass
            parent = current.parent
            if parent == current:
                break
            current = parent
        memories.extend(project_memories)

        claude_home = Path.home() / ".claude"
        if claude_home.exists():
            for name in ["CLAUDE.md", "claude.md"]:
                md_file = claude_home / name
                if md_file.exists():
                    try:
                        content = md_file.read_text(encoding='utf-8', errors='replace')
                        memories.append({
                            "name": name,
                            "path": str(md_file),
                            "scope": "global",
                            "content": content,
                        })
                    except Exception:
                        pass
            settings_file = claude_home / "settings.json"
            if settings_file.exists():
                try:
                    content = settings_file.read_text(encoding='utf-8', errors='replace')
                    memories.append({
                        "name": "settings.json",
                        "path": str(settings_file),
                        "scope": "global",
                        "content": content,
                    })
                except Exception:
                    pass

    elif agent == "codex":
        for name in ["AGENTS.md", "agents.md", "CODEX.md"]:
            md_file = Path(base) / name
            if md_file.exists():
                try:
                    content = md_file.read_text(encoding='utf-8', errors='replace')
                    memories.append({
                        "name": name,
                        "path": str(md_file),
                        "scope": "project",
                        "content": content,
                    })
                except Exception:
                    pass
        codex_home = Path.home() / ".codex"
        if codex_home.exists():
            for f in codex_home.iterdir():
                if f.is_file() and f.suffix in ('.md', '.json', '.yaml', '.yml'):
                    try:
                        content = f.read_text(encoding='utf-8', errors='replace')
                        memories.append({
                            "name": f.name,
                            "path": str(f),
                            "scope": "global",
                            "content": content,
                        })
                    except Exception:
                        pass

    return {"memories": memories}


@router.get("/agent/todo")
async def get_agent_todo(
    authorization: Optional[str] = Header(default=None),
    agent: str = "claude",
    cwd: str = "",
):
    """Get current agent's TODO list from its session data."""
    router.state.check_auth(authorization)
    base = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    todos = []

    if agent == "claude":
        claude_projects = Path.home() / ".claude" / "projects"
        if claude_projects.exists():
            best_session = None
            best_mtime = 0
            for project_dir in claude_projects.iterdir():
                if not project_dir.is_dir():
                    continue
                for session_file in project_dir.glob("*.json"):
                    try:
                        mtime = session_file.stat().st_mtime
                        if mtime > best_mtime:
                            data = json.loads(session_file.read_text(encoding='utf-8', errors='replace'))
                            session_cwd = data.get("cwd", "") or data.get("projectDir", "")
                            if session_cwd and (base.startswith(session_cwd) or session_cwd.startswith(base)):
                                best_session = data
                                best_mtime = mtime
                    except Exception:
                        continue

            if best_session:
                for msg in best_session.get("messages", []):
                    content = msg.get("content", "")
                    if isinstance(content, str) and "todo" in content.lower():
                        items = re.findall(r'[-*]\s*\[([ xX])\]\s*(.+)', content)
                        for checked, text in items:
                            todos.append({
                                "text": text.strip(),
                                "done": checked.lower() == 'x',
                                "source": "session",
                            })

    return {"todos": todos}
