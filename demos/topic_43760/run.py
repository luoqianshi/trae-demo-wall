#!/usr/bin/env python3
"""
Agent Everywhere - 启动脚本
让 AI Agent 随处可用
"""

import asyncio
import sys
import os
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent))

from gateway.server import AgentGateway


def main():
    """主入口"""
    print("=" * 50)
    print("  🤖 Agent Everywhere")
    print("  让你的 AI Agent 随处可用")
    print("=" * 50)
    print()
    
    # 检查是否使用 Mock 模式
    use_mock = os.getenv("USE_MOCK", "false").lower() == "true"
    
    if use_mock:
        print("🧪 运行模式: Mock (模拟 Agent)")
        print("   设置环境变量 USE_MOCK=false 使用真实 Agent")
    else:
        print("🔧 运行模式: 真实 Agent")
        print("   设置环境变量 USE_MOCK=true 启用模拟模式")
    print()
    
    # 检查可用 Agent
    async def check_agents():
        if use_mock:
            from gateway.adapters import MockClaudeAdapter, MockCodexAdapter
            adapters = [
                ("Claude Code (Mock)", MockClaudeAdapter()),
                ("Codex (Mock)", MockCodexAdapter()),
            ]
        else:
            from gateway.adapters import ClaudeAdapter, CodexAdapter
            adapters = [
                ("Claude Code", ClaudeAdapter()),
                ("Codex", CodexAdapter()),
            ]
        
        print("检查可用 Agent...")
        for name, adapter in adapters:
            info = await adapter.get_info()
            status = "✅" if info.available else "❌"
            version = f" (v{info.version})" if info.version else ""
            print(f"  {status} {name}{version}")
        print()
    
    asyncio.run(check_agents())
    
    # 启动服务
    port = int(os.getenv("PORT", "8000"))
    print("启动 Agent Everywhere 服务...")
    print(f"访问地址: http://localhost:{port}")
    if os.getenv("AGENT_ACCESS_TOKEN"):
        print("访问控制: 已启用 AGENT_ACCESS_TOKEN")
    if os.getenv("AGENT_WORKSPACES"):
        print(f"工作目录: {os.getenv('AGENT_WORKSPACES')}")
    print()
    print("按 Ctrl+C 停止服务")
    print("-" * 50)
    
    gateway = AgentGateway()
    gateway.run(host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
