"""
Mock Agent 适配器 - 用于测试
"""

import asyncio
from typing import AsyncIterator
from .base import BaseAdapter, AgentInfo


class MockClaudeAdapter(BaseAdapter):
    """模拟 Claude Code 适配器"""
    
    def __init__(self):
        super().__init__("claude")
    
    async def is_available(self) -> bool:
        """始终可用"""
        return True
    
    async def get_info(self) -> AgentInfo:
        """获取模拟信息"""
        return AgentInfo(
            name="Claude Code (Mock)",
            description="Anthropic's AI coding assistant (模拟模式)",
            available=True,
            version="mock-1.0.0"
        )
    
    async def execute(self, prompt: str, cwd: str = ".") -> AsyncIterator[str]:
        """模拟执行"""
        # 模拟思考过程
        responses = [
            "我来帮你处理这个请求...\n\n",
            "首先，让我分析一下你的需求：\n",
            f"- 输入: {prompt[:50]}{'...' if len(prompt) > 50 else ''}\n",
            "- 工作目录: " + cwd + "\n\n",
            "根据分析，我建议：\n\n",
            "```typescript\n",
            "// 这是一个示例代码\n",
            "function example() {\n",
            "  console.log('Hello from Claude Code!');\n",
            "  return {\n",
            "    status: 'success',\n",
            "    message: '任务已完成'\n",
            "  };\n",
            "}\n",
            "```\n\n",
            "✅ 完成！我已经为你生成了示例代码。\n",
            "你可以根据需要修改这个实现。"
        ]
        
        for chunk in responses:
            await asyncio.sleep(0.1)  # 模拟流式延迟
            yield chunk


class MockCodexAdapter(BaseAdapter):
    """模拟 Codex 适配器"""
    
    def __init__(self):
        super().__init__("codex")
    
    async def is_available(self) -> bool:
        """始终可用"""
        return True
    
    async def get_info(self) -> AgentInfo:
        """获取模拟信息"""
        return AgentInfo(
            name="Codex (Mock)",
            description="OpenAI's AI coding agent (模拟模式)",
            available=True,
            version="mock-1.0.0"
        )
    
    async def execute(self, prompt: str, cwd: str = ".") -> AsyncIterator[str]:
        """模拟执行"""
        responses = [
            "🚀 Codex 正在处理...\n\n",
            "分析代码结构...\n",
            "✓ 发现 3 个文件\n",
            "✓ 识别主要模块\n\n",
            "生成修改建议：\n\n",
            "```diff\n",
            "+ import { useState } from 'react';\n",
            "+ \n",
            "  export function Component() {\n",
            "+   const [count, setCount] = useState(0);\n",
            "+   \n",
            "    return (\n",
            "      <div>\n",
            "+       <p>Count: {count}</p>\n",
            "+       <button onClick={() => setCount(c => c + 1)}>\n",
            "+         Increment\n",
            "+       </button>\n",
            "      </div>\n",
            "    );\n",
            "  }\n",
            "```\n\n",
            "✅ 已生成代码修改建议！\n",
            "这些改动添加了状态管理功能。"
        ]
        
        for chunk in responses:
            await asyncio.sleep(0.08)
            yield chunk
