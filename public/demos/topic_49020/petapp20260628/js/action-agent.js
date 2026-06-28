/* action-agent.js — 动作 Agent（全局单例 ActionAgent） */
/* 通过 Function Calling 决定小人动作/表情/语气气泡/粒子特效 */

const ActionAgent = {
  // 工具定义：perform_action
  tools: [{
    type: 'function',
    function: {
      name: 'perform_action',
      description: '让屏幕右侧的可爱小人执行动作、设置表情，并可显示简短语气气泡与粒子特效。每次回复必须调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['wave', 'jump', 'dance', 'nod', 'shake', 'walk', 'spin', 'sleep', 'surprise', 'idle'],
            description: '小人的肢体动作。wave=挥手，jump=蹦跳，dance=跳舞，nod=点头，shake=摇头，walk=散步，spin=转圈，sleep=打瞌睡，surprise=惊讶，idle=待机'
          },
          expression: {
            type: 'string',
            enum: ['normal', 'happy', 'surprised', 'sad', 'sleepy', 'love', 'wink', 'angry', 'dizzy'],
            description: '小人的面部表情。normal=正常，happy=开心，surprised=惊讶，sad=伤心，sleepy=困倦，love=爱心眼，wink=眨眼，angry=生气，dizzy=晕眩'
          },
          bubble: {
            type: 'string',
            description: '可选。2-8字的简短语气词或拟声词，显示在小人头顶气泡里，如"嘿嘿~""哇！""呜呜...""蹦蹦~"'
          },
          particles: {
            type: 'string',
            enum: ['none', 'hearts', 'stars', 'sparkles', 'notes'],
            description: '可选。粒子特效。none=无，hearts=爱心，stars=星星，sparkles=闪光，notes=音符'
          }
        },
        required: ['action', 'expression']
      }
    }
  }],

  /**
   * 决策小人动作
   * @param {Object} opts { signal }
   * @returns {Object|null} { action, expression, bubble?, particles? }，失败返回 null
   */
  async decide({ signal }) {
    // 动作 Agent 用最近 6 条对话上下文（省 token）
    const messages = [
      { role: 'system', content: Config.data.actionSystemPrompt },
      ...Memory.recentContext(6)
    ];

    const msg = await API.chatWithTools({
      messages: messages,
      tools: this.tools,
      tool_choice: 'auto',
      model: Config.data.actionModel,
      temperature: Config.data.actionTemperature,
      signal: signal
    });

    if (!msg || !msg.tool_calls || !msg.tool_calls.length) {
      return null; // 未调用工具 → 降级
    }

    const tc = msg.tool_calls[0];
    if (!tc.function || !tc.function.arguments) return null;

    let args;
    try {
      args = JSON.parse(tc.function.arguments);
    } catch (e) {
      return null; // JSON 解析失败 → 降级
    }

    // 校验必填字段
    if (!args.action || !args.expression) return null;

    return args;
  }
};
