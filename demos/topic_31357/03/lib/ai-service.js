/**
 * AI服务集成模块 - 负责调用大模型API进行PRD智能生成
 * 支持自定义API地址，兼容OpenAI接口格式
 */

const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

class AIService {
  constructor() {
    this.apiKey = '';
    this.apiUrl = '';
    this.model = '';
  }

  /**
   * 初始化配置
   */
  async init() {
    const configs = await chrome.storage.local.get(['apiKey', 'apiUrl', 'model']);
    this.apiKey = configs.apiKey || '';
    this.apiUrl = configs.apiUrl || DEFAULT_API_URL;
    this.model = configs.model || DEFAULT_MODEL;
  }

  /**
   * 更新配置 - 只更新传入的字段，未传入的字段保持不变
   */
  async updateConfig({ apiKey, apiUrl, model }) {
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (apiUrl !== undefined) this.apiUrl = apiUrl || DEFAULT_API_URL;
    if (model !== undefined) this.model = model || DEFAULT_MODEL;

    // 只写入实际更新的字段，避免覆盖未传入的有效值
    const updateData = {};
    if (apiKey !== undefined) updateData.apiKey = this.apiKey;
    if (apiUrl !== undefined) updateData.apiUrl = this.apiUrl;
    if (model !== undefined) updateData.model = this.model;

    if (Object.keys(updateData).length > 0) {
      await chrome.storage.local.set(updateData);
    }
  }

  /**
   * 检查API Key是否已配置
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  /**
   * 测试API连接
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: 'API Key未配置' };
    }
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
          max_tokens: 20,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          return { success: true, message: '连接成功，API Key有效' };
        }
        return { success: false, message: 'API返回数据格式异常' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP错误 ${response.status}`;
        return { success: false, message: `连接失败：${errorMsg}` };
      }
    } catch (error) {
      return { success: false, message: `网络错误：${error.message}` };
    }
  }

  /**
   * 调用AI生成PRD文档
   */
  async generatePRD(pageData) {
    if (!this.isConfigured()) {
      throw new Error('请先配置有效的API Key');
    }

    const systemPrompt = this._buildSystemPrompt();
    const userPrompt = this._buildUserPrompt(pageData);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP错误 ${response.status}`;
        if (response.status === 401) {
          throw new Error('API Key无效或已过期，请重新配置');
        }
        throw new Error(`AI接口调用失败：${errorMsg}`);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error('AI返回数据为空，请重试');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error.message.includes('API Key') || error.message.includes('AI接口')) {
        throw error;
      }
      throw new Error(`网络请求失败：${error.message}，请检查网络连接和API地址`);
    }
  }

  /**
   * 构建系统提示词
   */
  _buildSystemPrompt() {
    return `你是一位资深产品经理，擅长编写标准化、结构化的产品需求文档(PRD)。
你的任务是根据提供的网页交互数据和页面信息，生成一份完整的PRD文档。

要求：
1. 严格按照指定的Markdown模板结构输出
2. 内容必须基于提供的页面数据，不得臆造功能
3. 语言为简体中文，逻辑通顺、专业规范
4. 所有模块必须完整输出，不可省略
5. 输出纯Markdown格式，不要用代码块包裹

输出模板结构：
# 【页面功能名】产品需求文档

## 1. 功能概述
（当前页面/模块的业务用途、使用场景、核心价值）

## 2. 页面信息
- 页面URL：
- 页面名称：
- 页面类型：（列表页/详情页/编辑页/弹窗功能等）

## 3. 核心功能列表
| 序号 | 功能名称 | 功能描述 |
|------|---------|---------|
| 1    |         |         |

## 4. 操作流程说明
（用户操作步骤、功能触发逻辑、前置条件、后置结果）

## 5. 页面元素说明
### 5.1 按钮说明
### 5.2 表单说明
### 5.3 弹窗说明
### 5.4 筛选项说明

## 6. 业务规则
### 6.1 表单校验规则
### 6.2 状态限制规则
### 6.3 权限逻辑
### 6.4 特殊场景规则

## 7. 异常场景
| 序号 | 异常场景 | 触发条件 | 提示信息/处理方式 |
|------|---------|---------|-----------------|

## 8. 功能优先级
- 默认优先级：普通
- 说明：（如有特殊优先级标注）`;
  }

  /**
   * 构建用户提示词
   */
  _buildUserPrompt(pageData) {
    const { pageInfo, interactions, elements, url, title } = pageData;

    let prompt = `请根据以下网页数据生成PRD文档：\n\n`;
    prompt += `## 页面基础信息\n`;
    prompt += `- 页面标题：${title || '未知'}\n`;
    prompt += `- 页面URL：${url || '未知'}\n\n`;

    if (pageInfo && pageInfo.length > 0) {
      prompt += `## 页面结构信息\n`;
      prompt += pageInfo.map(info => `- ${info}`).join('\n');
      prompt += '\n\n';
    }

    if (elements && elements.length > 0) {
      prompt += `## 页面元素信息\n`;
      prompt += elements.map(el => {
        let desc = `- 类型：${el.type}，标签：${el.label || el.text || '无'}`;
        if (el.placeholder) desc += `，占位符：${el.placeholder}`;
        if (el.required) desc += `，必填`;
        if (el.options && el.options.length > 0) desc += `，选项：${el.options.join('/')}`;
        if (el.validation) desc += `，校验：${el.validation}`;
        return desc;
      }).join('\n');
      prompt += '\n\n';
    }

    if (interactions && interactions.length > 0) {
      prompt += `## 用户交互行为记录（按操作顺序）\n`;
      prompt += interactions.map((inter, i) => {
        let desc = `${i + 1}. 操作类型：${inter.type}`;
        if (inter.target) desc += `，目标：${inter.target}`;
        if (inter.value !== undefined && inter.value !== '') desc += `，输入值：${inter.value}`;
        if (inter.result) desc += `，结果：${inter.result}`;
        return desc;
      }).join('\n');
      prompt += '\n\n';
    }

    prompt += `请严格按照PRD模板结构生成完整的Markdown文档，确保所有模块内容完整、专业。`;
    return prompt;
  }
}

// 导出单例
const aiService = new AIService();
