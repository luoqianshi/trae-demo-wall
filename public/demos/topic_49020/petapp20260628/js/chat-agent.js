/* chat-agent.js — 聊天 Agent（全局单例 ChatAgent） */
/* 流式生成回复，逐 token 通过 onToken 回调输出，支持图片消息（vision） */

const ChatAgent = {
  /**
   * 流式生成回复
   * @param {Object} opts { onToken(token), signal, imageMessage }
   *   imageMessage: 可选，图片消息 { role:'user', content:[{type:'text'},{type:'image_url'}] }
   *   传入时会替换快照中最后一条 user 消息为 vision 格式
   * @returns {string} 完整回复文本
   */
  async reply({ onToken, signal, imageMessage }) {
    // 取全量快照（含 system + 历史 + 动作备注），保证并行安全
    const messages = Memory.snapshot();

    // 如果有图片消息，替换最后一条 user 消息为 vision 格式
    if (imageMessage) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          messages[i] = imageMessage;
          break;
        }
      }
    }

    let full = '';

    try {
      for await (const token of API.streamChat({
        messages: messages,
        model: Config.data.chatModel,
        temperature: Config.data.temperature,
        signal: signal
      })) {
        full += token;
        if (onToken) onToken(token);
      }
      // 写回共享记忆（只存文本，不存 base64 图片）
      Memory.addAssistant(full);
      return full;
    } catch (e) {
      // 中止时仍保存已生成部分
      if (e.name === 'AbortError') {
        if (full.trim()) Memory.addAssistant(full);
      }
      throw e;
    }
  }
};
