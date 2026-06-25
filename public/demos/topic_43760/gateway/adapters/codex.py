"""
Codex CLI 适配器
"""

import asyncio
import shutil
from typing import AsyncIterator, Optional
from .base import BaseAdapter, AgentInfo


class CodexAdapter(BaseAdapter):
    """Codex CLI 适配器"""
    
    def __init__(self):
        super().__init__("codex")
        self._process: Optional[asyncio.subprocess.Process] = None
    
    async def is_available(self) -> bool:
        """检查 Codex 是否安装"""
        return shutil.which("codex") is not None
    
    async def get_info(self) -> AgentInfo:
        """获取 Codex 信息"""
        available = await self.is_available()
        version = None
        
        if available:
            try:
                proc = await asyncio.create_subprocess_exec(
                    "codex", "--version",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await proc.communicate()
                version = stdout.decode().strip()
            except Exception:
                pass
        
        return AgentInfo(
            name="Codex",
            description="OpenAI's AI coding agent",
            available=available,
            version=version
        )
    
    async def execute(self, prompt: str, cwd: str = ".") -> AsyncIterator[str]:
        """执行 Codex 命令"""
        self._process = await asyncio.create_subprocess_exec(
            "codex",
            prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd
        )
        
        # 流式读取输出
        while True:
            line = await self._process.stdout.readline()
            if not line:
                break
            yield line.decode()
        
        # 读取错误输出
        stderr = await self._process.stderr.read()
        if stderr:
            yield f"[ERROR] {stderr.decode()}"
        
        await self._process.wait()
        self._process = None
    
    async def stop(self):
        """停止当前执行"""
        if self._process and self._process.returncode is None:
            self._process.terminate()
            try:
                await asyncio.wait_for(self._process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                self._process.kill()
            self._process = None
