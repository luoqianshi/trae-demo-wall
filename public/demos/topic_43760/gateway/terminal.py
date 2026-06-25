"""
Terminal session manager - PTY-based interactive terminal for Agent CLIs.
Uses winpty on Windows, pty on Unix.
"""

import asyncio
import json
import os
import struct
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional

from fastapi import WebSocket


@dataclass
class TerminalSession:
    """A live PTY session wrapping an Agent CLI."""
    id: str
    agent: str
    cwd: str
    pid: Optional[int] = None
    fd: Optional[int] = None
    write_fd: Optional[int] = None
    exit_code: Optional[int] = None
    created_at: float = field(default_factory=lambda: __import__('time').time())


class TerminalManager:
    """Manages PTY sessions for interactive Agent terminals."""

    def __init__(self):
        self.sessions: Dict[str, TerminalSession] = {}
        self._read_tasks: Dict[str, asyncio.Task] = {}

    # ------------------------------------------------------------------
    # PTY creation (cross-platform)
    # ------------------------------------------------------------------

    async def create_session(self, agent: str, cwd: str, cols: int = 80, rows: int = 24) -> TerminalSession:
        """Spawn a new terminal session running the given Agent CLI."""
        session_id = __import__('uuid').uuid4().hex[:12]

        # Resolve the CLI command
        # On Windows: spawn cmd.exe that runs the agent command
        # This keeps the shell alive so the agent can be interactive
        cmd_map = {
            "claude": ["cmd.exe", "/k", "claude"],
            "codex": ["cmd.exe", "/k", "codex"],
        }
        cmd = cmd_map.get(agent)
        if not cmd:
            raise ValueError(f"Unknown agent: {agent}")

        if sys.platform == "win32":
            return await self._create_winpty_session(session_id, agent, cmd, cwd, cols, rows)
        else:
            return await self._create_unix_session(session_id, agent, cmd, cwd, cols, rows)

    async def _create_winpty_session(self, session_id, agent, cmd, cwd, cols, rows):
        import winpty

        pty = winpty.PTY(cols, rows)
        # winpty 3.x: spawn(executable, cmdline=..., cwd=..., env=...)
        cmdline = ' '.join(cmd[1:]) if len(cmd) > 1 else ''
        # Don't pass env - let the process inherit the current environment
        # This avoids winpty env formatting issues
        pty.spawn(cmd[0], cmdline=cmdline, cwd=cwd)

        session = TerminalSession(
            id=session_id,
            agent=agent,
            cwd=cwd,
            pid=pty.pid,
        )
        session._pty = pty  # attach the PTY object
        self.sessions[session_id] = session

        # Start reading from PTY
        self._read_tasks[session_id] = asyncio.create_task(
            self._read_loop_winpty(session_id)
        )
        return session

    async def _create_unix_session(self, session_id, agent, cmd, cwd, cols, rows):
        import pty
        import fcntl
        import termios
        import tty

        master, slave = pty.openpty()

        # Set terminal size
        winsize = struct.pack("HHHH", rows, cols, 0, 0)
        fcntl.ioctl(slave, termios.TIOCSWINSZ, winsize)

        # Set non-blocking on master
        flags = fcntl.fcntl(master, fcntl.F_GETFL)
        fcntl.fcntl(master, fcntl.F_SETFL, flags | os.O_NONBLOCK)

        env = {**os.environ, "TERM": "xterm-256color", "COLORTERM": "truecolor"}
        proc = await asyncio.create_subprocess_exec(
            cmd[0],
            *cmd[1:],
            stdin=slave,
            stdout=slave,
            stderr=slave,
            cwd=cwd,
            env=env,
            preexec_fn=os.setsid if os.name != 'nt' else None,
        )

        os.close(slave)

        session = TerminalSession(
            id=session_id,
            agent=agent,
            cwd=cwd,
            pid=proc.pid,
            fd=master,
        )
        session._proc = proc
        self.sessions[session_id] = session

        self._read_tasks[session_id] = asyncio.create_task(
            self._read_loop_unix(session_id)
        )
        return session

    # ------------------------------------------------------------------
    # Read loops
    # ------------------------------------------------------------------

    async def _read_loop_winpty(self, session_id: str):
        """Read from winpty PTY and push to WebSocket callbacks."""
        session = self.sessions.get(session_id)
        if not session:
            return

        pty = getattr(session, '_pty', None)
        if not pty:
            return

        try:
            while True:
                # winpty 3.x: read(blocking=True/False) returns str or None
                data = pty.read(blocking=False)
                if data:
                    await self._on_data(session_id, data.encode('utf-8', errors='replace'))
                if not pty.isalive():
                    break
                # Small sleep to avoid busy-waiting
                await asyncio.sleep(0.05)
        except Exception:
            pass
        finally:
            session.exit_code = pty.get_exitstatus() if hasattr(pty, 'get_exitstatus') else -1
            await self._on_exit(session_id)

    async def _read_loop_unix(self, session_id: str):
        """Read from Unix PTY master fd."""
        session = self.sessions.get(session_id)
        if not session:
            return

        loop = asyncio.get_event_loop()
        master = session.fd

        try:
            while True:
                try:
                    data = await loop.run_in_executor(None, os.read, master, 4096)
                    if not data:
                        break
                    await self._on_data(session_id, data)
                except OSError:
                    break
        except Exception:
            pass
        finally:
            session.exit_code = -1
            await self._on_exit(session_id)

    # ------------------------------------------------------------------
    # Data callbacks (filled by the WebSocket handler)
    # ------------------------------------------------------------------

    def set_data_callback(self, session_id: str, callback):
        """Register a callback for PTY output. callback(data: bytes)"""
        session = self.sessions.get(session_id)
        if session:
            session._data_cb = callback

    def set_exit_callback(self, session_id: str, callback):
        session = self.sessions.get(session_id)
        if session:
            session._exit_cb = callback

    async def _on_data(self, session_id: str, data):
        session = self.sessions.get(session_id)
        if session and hasattr(session, '_data_cb') and session._data_cb:
            await session._data_cb(data)

    async def _on_exit(self, session_id: str):
        session = self.sessions.get(session_id)
        if session and hasattr(session, '_exit_cb') and session._exit_cb:
            await session._exit_cb(session.exit_code)

    # ------------------------------------------------------------------
    # Write to PTY
    # ------------------------------------------------------------------

    async def write(self, session_id: str, data: bytes):
        session = self.sessions.get(session_id)
        if not session:
            return

        if sys.platform == "win32":
            pty = getattr(session, '_pty', None)
            if pty and pty.isalive():
                pty.write(data.decode('utf-8', errors='replace'))
        else:
            if session.fd is not None:
                await asyncio.get_event_loop().run_in_executor(
                    None, os.write, session.fd, data
                )

    # ------------------------------------------------------------------
    # Resize
    # ------------------------------------------------------------------

    async def resize(self, session_id: str, cols: int, rows: int):
        session = self.sessions.get(session_id)
        if not session:
            return

        if sys.platform == "win32":
            pty = getattr(session, '_pty', None)
            if pty:
                pty.set_size(cols, rows)
        else:
            import fcntl
            import termios
            if session.fd is not None:
                winsize = struct.pack("HHHH", rows, cols, 0, 0)
                fcntl.ioctl(session.fd, termios.TIOCSWINSZ, winsize)

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------

    async def kill(self, session_id: str):
        session = self.sessions.get(session_id)
        if not session:
            return

        # Cancel read task
        task = self._read_tasks.pop(session_id, None)
        if task and not task.done():
            task.cancel()

        if sys.platform == "win32":
            pty = getattr(session, '_pty', None)
            if pty:
                try:
                    # winpty 3.x doesn't have kill(), use cancel_io or just let it die
                    pty.cancel_io()
                except Exception:
                    pass
        else:
            proc = getattr(session, '_proc', None)
            if proc and proc.returncode is None:
                try:
                    proc.terminate()
                    await asyncio.wait_for(proc.wait(), timeout=3)
                except Exception:
                    try:
                        proc.kill()
                    except Exception:
                        pass

            if session.fd is not None:
                try:
                    os.close(session.fd)
                except Exception:
                    pass

        if session_id in self.sessions:
            del self.sessions[session_id]
