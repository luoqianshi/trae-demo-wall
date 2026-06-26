import Taro from '@tarojs/taro';

// 支持的AI提供商
export type AIProvider = 'siliconflow' | 'zhipu' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

// 默认配置
export const DEFAULT_CONFIG: AIConfig = {
  provider: 'siliconflow',
  apiKey: '',
  model: 'Qwen/Qwen2.5-7B-Instruct'
};

// 系统提示词 - 专为陪伴老年人设计
const SYSTEM_PROMPT = `你是一个温暖、耐心、友善的AI陪伴助手，专门为中老年人服务。

你的特点：
1. 说话语气亲切、温暖，像家人一样
2. 使用简单易懂的词汇，避免复杂术语
3. 回答要简洁明了，不要太长
4. 可以聊天、讲笑话、讲健康知识、读新闻、听音乐
5. 要表现出关心和耐心
6. 偶尔可以提醒老人注意身体、多喝水、多运动

请始终用温暖友善的口吻与用户交流！`;

export class AIService {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  hasApiKey(): boolean {
    return !!this.config.apiKey?.trim();
  }

  async chat(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<string> {
    if (!this.hasApiKey()) {
      throw new Error('请先配置API Key');
    }

    try {
      const response = await this.callSiliconFlow(messages);
      return response;
    } catch (error) {
      console.error('AI调用失败:', error);
      throw error;
    }
  }

  private async callSiliconFlow(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<string> {
    const fullMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages
    ];

    const response = await Taro.request({
      url: 'https://api.siliconflow.cn/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      data: {
        model: this.config.model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 500
      }
    });

    if (response.statusCode === 200 && response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error(response.data?.message || 'AI服务调用失败');
    }
  }
}

// 创建单例
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
