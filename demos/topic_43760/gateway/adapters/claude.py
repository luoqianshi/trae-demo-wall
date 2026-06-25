"""
Claude Code 适配器
"""

import asyncio
import shutil
from typing import AsyncIterator, Optional
from .base import BaseAdapter, AgentInfo


class ClaudeAdapter(BaseAdapter):
    """Claude Code 适配器"""
    
    def __init__(self):
        super().__init__("claude")
        self._process: Optional[asyncio.subprocess.Process] = None
    
    async def is_available(self) -> bool:
        """检查 Claude Code 是否安装"""
        return shutil.which("claude") is not None
    
    async def get_info(self) -> AgentInfo:
        """获取 Claude Code 信息"""
        available = await self.is_available()
        version = None
        
        if available:
            try:
                proc = await asyncio.create_subprocess_exec(
                    "claude", "--version",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await proc.communicate()
                version = stdout.decode().strip()
            except Exception:
                pass
        
        return AgentInfo(
            name="Claude Code",
            description="Anthropic's official AI coding assistant",
            available=available,
            version=version
        )
    
    async def execute(self, prompt: str, cwd: str = ".") -> AsyncIterator[str]:
        """执行 Claude Code 命令"""
        self._process = await asyncio.create_subprocess_exec(
            "claude",
            "--print",  # 非交互模式
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
