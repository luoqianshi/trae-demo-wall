class AIAgent {
  constructor() {
    this.messages = [];
    this.isGenerating = false;
  }

  async generateResponse(userMessage) {
    if (this.isGenerating) return '';
    this.isGenerating = true;

    try {
      this.messages.push({ role: 'user', content: userMessage });

      const systemPrompt = `你是一位博学多才的儒家文化专家，精通《论语》、《孟子》、《大学》、《中庸》等儒家经典，熟悉孔子、孟子、颜回、曾子等儒家先贤的生平事迹，了解齐鲁文化的历史脉络和文化传承。

你的回答风格：
1. 深入浅出，通俗易懂，善于用现代语言解释古代思想
2. 引经据典，适当引用经典原文增强说服力
3. 结合实际，联系当代社会生活解读传统文化的现代意义
4. 语气亲切，像是一位智慧的长者在与晚辈对话

请根据用户的问题，结合儒家经典和齐鲁文化知识，给出准确、全面、生动的回答。`;

      const messagesToSend = [
        { role: 'system', content: systemPrompt },
        ...this.messages.slice(-10)
      ];

      const response = await callZhipuAPI(messagesToSend);
      this.messages.push({ role: 'assistant', content: response });

      return response;
    } catch (error) {
      console.error('AI generation error:', error);
      return '抱歉，我现在无法回答您的问题，请稍后再试。';
    } finally {
      this.isGenerating = false;
    }
  }

  clearMessages() {
    this.messages = [];
  }

  getMessageCount() {
    return this.messages.length;
  }
}

const aiAgent = new AIAgent();

window.aiAgent = aiAgent;