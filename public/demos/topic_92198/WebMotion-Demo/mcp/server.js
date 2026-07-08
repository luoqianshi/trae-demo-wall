/**
 * WebMotion MCP Server
 * 让 AI Agent 能够通过 MCP 协议操作 WebMotion
 *
 * 使用方式：
 * 1. 在 AI Agent 的 MCP 配置中添加此 server
 * 2. AI Agent 可以调用 generate_animation、export_animation 等工具
 *
 * 运行：node server.js
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');

// 动画模板（与前端 templates.js 同步）
const TEMPLATES = require('../js/templates.js');

// 系统 Prompt
const SYSTEM_PROMPT = `你是一个专业的 MG 动画设计师，擅长用 Canvas 2D API 创建动态图形动画。

你的任务：根据用户提供的文案，提取其中的关键知识点或视觉重点，为每个重点生成一段 MG 动画代码。

## WebMotion 动画 API

- ctx: Canvas 2D 渲染上下文
- t: 当前时间（秒，从 0 到 duration）
- width, height: 画布尺寸
- utils: 工具函数集 { lerp, clamp, map, ease: { linear, outCubic, inOutCubic, outBack, bounce, outElastic, ... }, color, deg2rad }

## 代码规则
1. 开头必须 ctx.clearRect(0, 0, width, height)
2. 背景透明
3. 使用缓动函数，动画平滑
4. 文字大而清晰
5. 现代配色：#c9a96e, #fb7185, #a78bfa, #22c55e, #f59e0b
6. 每场景 2-5 秒，有入场出场效果

## 输出 JSON
{
  "summary": "分析总结",
  "scenes": [{ "name": "", "description": "", "duration": 3, "code": "" }]
}`;

// 创建 MCP Server
const server = new Server(
  { name: 'webmotion-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, prompts: {} } }
);

// 工具处理
server.setRequestHandler({ method: 'tools/list' }, async () => ({
  tools: [
    {
      name: 'generate_animation',
      description: '根据文案文本生成 MG 动画场景',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '文案文本' },
          sceneCount: { type: 'number', description: '场景数量', default: 4 },
          style: { type: 'string', description: '动画风格', default: '现代简约' }
        },
        required: ['text']
      }
    },
    {
      name: 'list_templates',
      description: '列出所有可用动画模板',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'get_template',
      description: '获取指定模板代码',
      inputSchema: {
        type: 'object',
        properties: {
          templateId: { type: 'string', enum: ['typewriter','bounce-text','bar-chart','particles','gradient-text','circle-burst'] }
        },
        required: ['templateId']
      }
    },
    {
      name: 'validate_code',
      description: '验证动画代码语法',
      inputSchema: {
        type: 'object',
        properties: { code: { type: 'string' } },
        required: ['code']
      }
    }
  ]
}));

server.setRequestHandler({ method: 'tools/call' }, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'generate_animation':
      // 返回生成动画的指导信息（实际 AI 调用由 Agent 完成）
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            instructions: '使用以下 Prompt 生成动画代码',
            systemPrompt: SYSTEM_PROMPT,
            userText: args.text,
            suggestedScenes: args.sceneCount || 4,
            style: args.style || '现代简约'
          }, null, 2)
        }]
      };

    case 'list_templates':
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(TEMPLATES.map(t => ({
            id: t.id, name: t.name, desc: t.desc, duration: t.duration
          })), null, 2)
        }]
      };

    case 'get_template': {
      const tpl = TEMPLATES.find(t => t.id === args.templateId);
      if (!tpl) return { content: [{ type: 'text', text: '模板未找到' }] };
      return { content: [{ type: 'text', text: tpl.js }] };
    }

    case 'validate_code': {
      try {
        new Function('ctx', 't', 'width', 'height', 'utils', args.code);
        return { content: [{ type: 'text', text: '代码语法正确' }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `语法错误: ${e.message}` }] };
      }
    }

    default:
      return { content: [{ type: 'text', text: `未知工具: ${name}` }] };
  }
});

// 启动 server
const transport = new StdioServerTransport();
server.connect(transport);
console.log('WebMotion MCP Server 已启动');
