const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.apiType = process.env.AI_API_TYPE || 'openai';
    this.apiBaseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
  }

  async generateSummary(transcript) {
    if (!this.apiKey) {
      return this.generateLocalSummary(transcript);
    }

    try {
      let messages = [];
      try {
        messages = JSON.parse(transcript);
      } catch {
        messages = [{ content: transcript, role: 'user' }];
      }

      const formattedMessages = messages.map(m => ({
        role: m.sender === 'expert' ? 'assistant' : 'user',
        content: m.content
      }));

      const prompt = {
        role: 'system',
        content: '你是一位专业的知识萃取专家。请对以下访谈对话进行深度分析和总结，提炼核心知识要点。输出格式要求：\n\n【访谈主题】一句话概括访谈核心内容\n\n【核心问题】列出用户提出的主要问题（3-5个）\n\n【专家解答】针对每个问题的关键回答\n\n【知识要点】提炼出可复用的经验和方法论\n\n【行动建议】基于访谈内容给出的具体建议\n\n请用简洁专业的语言输出，确保信息准确且易于理解。'
      };

      const response = await axios.post(
        `${this.apiBaseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [prompt, ...formattedMessages],
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (err) {
      console.error('AI API调用失败，使用本地规则生成:', err.message);
      return this.generateLocalSummary(transcript);
    }
  }

  generateLocalSummary(transcript) {
    if (!transcript) return '';
    let messages = [];
    try {
      messages = JSON.parse(transcript);
    } catch {
      messages = [{ content: transcript }];
    }
    if (!Array.isArray(messages) || messages.length === 0) return '';

    const userMessages = messages.filter(m => m.sender === 'user');
    const expertMessages = messages.filter(m => m.sender === 'expert' || m.sender === 'system');

    const topics = userMessages.slice(0, 5).map(m => m.content.substring(0, 30)).join('、');
    const answers = expertMessages.slice(0, 5).map(m => m.content.substring(0, 100)).join('\n');

    const summary = `【访谈主题】${topics || '访谈交流'}\n\n【核心问题】本次访谈共涉及${userMessages.length}个问题\n\n【专家解答】\n${answers || '暂无详细解答内容'}\n\n【知识要点】\n1. 通过专家访谈获取专业知识和经验\n2. 记录关键对话内容便于后续知识沉淀\n3. 可将访谈内容转化为标准化知识文档\n\n【行动建议】\n- 将本次访谈的关键要点整理成知识库条目\n- 定期回顾和更新相关知识内容\n- 分享给团队成员共同学习\n\n【总结】本次访谈共${messages.length}条消息，专家针对用户问题给出了详细解答，建议将有用信息沉淀到知识库中。`;

    return summary;
  }

  async analyzeKnowledgeRelation(sourceContent, targetContent) {
    if (!this.apiKey) {
      return { type: 'related', weight: 0.5 };
    }

    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '请分析两段知识内容之间的关系类型和关联强度。关系类型包括：related（相关）、derived_from（衍生自）、part_of（属于）、reference（引用）。关联强度为0-1之间的数值。请直接输出JSON格式：{"type": "关系类型", "weight": 关联强度}'
            },
            {
              role: 'user',
              content: `知识A：${sourceContent.substring(0, 500)}\n\n知识B：${targetContent.substring(0, 500)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const result = response.data.choices[0].message.content.trim();
      try {
        return JSON.parse(result);
      } catch {
        return { type: 'related', weight: 0.5 };
      }
    } catch (err) {
      console.error('AI关系分析失败:', err.message);
      return { type: 'related', weight: 0.5 };
    }
  }
}

module.exports = new AIService();