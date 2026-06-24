/**
 * Echo Tools Module
 * Parses tool calls from LLM replies and executes them
 * Tools: web_search, generate_file, update_task, save_capability, open_url
 */

class EchoTools {
  constructor(memory) {
    this.memory = memory;
    this.onTaskUpdate = null;
    this.onFileGenerated = null;
    this.onCapabilitySaved = null;
    this.onSearchResult = null;
  }

  /**
   * Parse tool calls from LLM reply
   * @param {string} reply - LLM reply text
   * @returns {Array} - array of { tool, params }
   */
  parseToolCalls(reply) {
    const toolCalls = [];
    const regex = /<!-- ECHO_TOOL:\s*(\w+)\s*-->([\s\S]*?)<!-- ECHO_TOOL_END -->/g;
    let match;

    while ((match = regex.exec(reply)) !== null) {
      const tool = match[1].trim();
      const rawParams = match[2].trim();

      try {
        // Try to parse as JSON
        const params = JSON.parse(rawParams);
        toolCalls.push({ tool, params });
      } catch (e) {
        // If JSON parse fails, try to extract key-value pairs
        console.warn(`[EchoTools] Failed to parse params for ${tool}:`, rawParams);
        toolCalls.push({ tool, params: { raw: rawParams } });
      }
    }

    return toolCalls;
  }

  /**
   * Execute a single tool call
   * @param {Object} toolCall - { tool, params }
   * @param {string} sessionId - current session ID
   * @returns {Object} - { success, result, message }
   */
  async executeToolCall(toolCall, sessionId) {
    const { tool, params } = toolCall;

    try {
      switch (tool) {
        case 'web_search':
          return await this.webSearch(params);
        case 'generate_file':
          return await this.generateFile(params, sessionId);
        case 'update_task':
          return await this.updateTask(params, sessionId);
        case 'save_capability':
          return await this.saveCapability(params);
        case 'open_url':
          return await this.openUrl(params);
        default:
          return { success: false, result: null, message: `未知工具: ${tool}` };
      }
    } catch (e) {
      return { success: false, result: null, message: `工具执行错误: ${e.message}` };
    }
  }

  /**
   * Execute multiple tool calls
   * @param {Array} toolCalls - array of { tool, params }
   * @param {string} sessionId - current session ID
   * @returns {Array} - array of results
   */
  async executeToolCalls(toolCalls, sessionId) {
    const results = [];
    for (const tc of toolCalls) {
      const result = await this.executeToolCall(tc, sessionId);
      results.push({ tool: tc.tool, params: tc.params, ...result });
    }
    return results;
  }

  /**
   * Web search - opens search in new tab
   */
  async webSearch(params) {
    const query = params.query || params.q || '';
    if (!query) {
      return { success: false, result: null, message: '搜索关键词为空' };
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    // Open in new tab
    window.open(searchUrl, '_blank');

    // Notify callback
    if (this.onSearchResult) {
      this.onSearchResult({ query, url: searchUrl });
    }

    return {
      success: true,
      result: { url: searchUrl, query },
      message: `已为你打开搜索: ${query}`,
    };
  }

  /**
   * Generate file - creates downloadable file and saves to memory
   */
  async generateFile(params, sessionId) {
    const { filename, language, description, content } = params;

    if (!filename || !content) {
      return { success: false, result: null, message: '文件名或内容为空' };
    }

    // Create download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    // Save to memory
    if (sessionId && this.memory) {
      await this.memory.saveFile(sessionId, filename, language || 'text', description || '', content);
    }

    // Notify callback
    if (this.onFileGenerated) {
      this.onFileGenerated({ filename, language, description, content });
    }

    return {
      success: true,
      result: { filename, language, description },
      message: `已生成文件: ${filename}`,
    };
  }

  /**
   * Update task status on the task board
   */
  async updateTask(params, sessionId) {
    const { task_id, status, note } = params;

    if (!task_id || !status) {
      return { success: false, result: null, message: '任务ID或状态为空' };
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
    if (!validStatuses.includes(status)) {
      return { success: false, result: null, message: `无效状态: ${status}` };
    }

    // Update in memory
    if (sessionId && this.memory) {
      await this.memory.updateTask(sessionId, task_id, { status, note: note || '' });
    }

    // Notify callback for UI update
    if (this.onTaskUpdate) {
      this.onTaskUpdate({ taskId: task_id, status, note: note || '' });
    }

    const statusLabels = {
      pending: '待执行',
      in_progress: '执行中',
      completed: '已完成',
      blocked: '已阻塞',
    };

    return {
      success: true,
      result: { taskId: task_id, status, note },
      message: `任务 ${task_id} 状态更新为: ${statusLabels[status] || status}`,
    };
  }

  /**
   * Save capability to the capability library
   */
  async saveCapability(params) {
    const { name, type, scenario, steps, notes } = params;

    if (!name) {
      return { success: false, result: null, message: '能力名称为空' };
    }

    let id = null;
    if (this.memory) {
      const saved = await this.memory.saveCapability(name, type, scenario, steps, notes);
      id = saved.id;
    }

    // Notify callback
    if (this.onCapabilitySaved) {
      this.onCapabilitySaved({ name, type, scenario, steps, id });
    }

    return {
      success: true,
      result: { name, type, id },
      message: `能力 "${name}" 已保存到能力库`,
    };
  }

  /**
   * Open URL in new tab
   */
  async openUrl(params) {
    const { url, description } = params;

    if (!url) {
      return { success: false, result: null, message: 'URL 为空' };
    }

    window.open(url, '_blank');

    return {
      success: true,
      result: { url, description },
      message: `已打开链接: ${description || url}`,
    };
  }

  /**
   * Format tool results for LLM context
   * @param {Array} results - array of tool execution results
   * @returns {string} - formatted string for LLM
   */
  formatToolResults(results) {
    if (!results || results.length === 0) return '';

    const lines = ['[工具执行结果]'];
    for (const r of results) {
      lines.push(`- ${r.tool}: ${r.success ? '成功' : '失败'} - ${r.message}`);
    }
    return lines.join('\n');
  }
}

// Export as global
window.EchoTools = EchoTools;
