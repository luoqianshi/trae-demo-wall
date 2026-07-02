/**
 * AI 服务模块
 * 接入 SiliconFlow 真实多模态 AI API
 * 支持图片理解 + 作业批改
 *
 * API 文档参考：https://docs.siliconflow.cn/
 * 使用 OpenAI 兼容格式调用
 */

var AIService = {

  // SiliconFlow API 配置
  // 注意：此 Demo 将 API Key 放在前端仅为演示方便。
  // 生产环境请务必通过后端代理调用 API，避免 Key 泄露。
  API_KEY: window.SILICONFLOW_API_KEY || 'YOUR_API_KEY_HERE',
  API_URL: 'https://api.siliconflow.cn/v1/chat/completions',
  // ★ 使用 SiliconFlow 平台实际可用的视觉语言模型
  // Qwen3-VL 系列支持图片理解，8B 轻量快速适合 Demo
  MODEL: 'Qwen/Qwen3-VL-8B-Instruct',

  /**
   * 调用 AI 批改作业
   * @param {string} imageBase64 - 图片的 Base64 编码（不含 data:image 前缀）
   * @param {string} mimeType - 图片的 MIME 类型，如 image/jpeg、image/png
   * @param {function} onProgress - 进度回调函数(step, message)
   * @returns {Promise<object>} 批改结果
   */
  gradeHomework: function(imageBase64, mimeType, onProgress) {
    var self = this;

    return new Promise(function(resolve, reject) {
      // 步骤 1：识别题目
      onProgress && onProgress(1, '正在识别图片中的题目...');

      var prompt = self.buildPrompt();

      // 步骤 2：调用 API
      onProgress && onProgress(2, '正在分析题目内容...');

      var xhr = new XMLHttpRequest();
      xhr.open('POST', self.API_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer ' + self.API_KEY);

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var response = JSON.parse(xhr.responseText);
              var content = response.choices[0].message.content;

              // ★ 调试：打印 AI 原始返回内容
              console.log('[DEBUG] AI raw response length:', content.length);
              console.log('[DEBUG] AI raw response preview:', content.substring(0, 500));
              console.log('[DEBUG] AI raw response tail:', content.substring(content.length - 200));

              // 步骤 3：解析结果
              onProgress && onProgress(3, '正在整理批改结果...');

              var result = self.parseResponse(content);
              resolve(result);
            } catch (e) {
              console.error('[DEBUG] Parse error:', e);
              console.error('[DEBUG] Raw content:', content);
              reject(new Error('解析 AI 响应失败: ' + e.message));
            }
          } else {
            var errorMsg = 'API 调用失败';
            try {
              var err = JSON.parse(xhr.responseText);
              errorMsg = (err.error && err.error.message) || err.message || errorMsg;
            } catch (e) {}
            reject(new Error(errorMsg + ' (状态码: ' + xhr.status + ')'));
          }
        }
      };

      xhr.onerror = function() {
        reject(new Error('网络请求失败，请检查网络连接'));
      };

      xhr.timeout = 60000; // 60 秒超时
      xhr.ontimeout = function() {
        reject(new Error('请求超时，AI 响应较慢，请重试'));
      };

      var requestBody = {
        model: self.MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:' + (mimeType || 'image/jpeg') + ';base64,' + imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1 // 更低温度，让输出更稳定、更遵循格式
      };

      xhr.send(JSON.stringify(requestBody));
    });
  },

  /**
   * 构建 Prompt，指导 AI 输出结构化批改结果
   */
  buildPrompt: function() {
    return '你是一位经验丰富的小学/初中作业批改老师。\n\n' +
      '【极其重要】我向你发送了一张作业图片，你必须**严格基于这张图片的实际内容**进行批改。' +
      '不要编造题目，不要假设题目内容，必须如实识别图片中写了什么。\n\n' +
      '完成以下任务：\n' +
      '1. 仔细查看图片，识别图片中的每一道题目（包括题号）\n' +
      '2. 找到学生写的答案\n' +
      '3. 判断每道题学生作答是否正确\n' +
      '4. 如果错误，给出正确答案和简洁易懂的解析\n\n' +
      '请严格按照以下 JSON 格式输出，不要输出任何其他文字：\n\n' +
      '```json\n' +
      '{\n' +
      '  "subject": "学科名称（如：小学数学、初中英语等）",\n' +
      '  "type": "题型（如：计算题、选择题、填空题等）",\n' +
      '  "questions": [\n' +
      '    {\n' +
      '      "id": 1,\n' +
      '      "content": "完整的题目内容",\n' +
      '      "studentAnswer": "学生写的答案",\n' +
      '      "correctAnswer": "正确答案",\n' +
      '      "isCorrect": true,\n' +
      '      "explanation": "用家长能理解的语言解释，50字以内"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n' +
      '```\n\n' +
      '重要规则：\n' +
      '- 只输出 JSON，不要加任何解释文字\n' +
      '- **必须基于图片实际内容，严禁编造题目**\n' +
      '- 手写字迹可能不清晰，请尽力识别，看不清的标注"(模糊)"\n' +
      '- 如果图片中没有学生答案，studentAnswer 填"(未作答)"\n' +
      '- 解析要像老师给家长讲解一样，通俗易懂';
  },

  /**
   * 解析 AI 返回的内容，提取 JSON 数据
   * 增强容错：处理截断、多余文本、格式不规范等情况
   */
  parseResponse: function(content) {
    // 步骤 1：清理 markdown 代码块标记
    var cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    // 步骤 2：找到第一个 { 和最后一个 }
    var firstBrace = cleaned.indexOf('{');
    var lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('AI 返回的内容中未找到有效的 JSON 结构');
    }
    var jsonStr = cleaned.substring(firstBrace, lastBrace + 1);

    // 步骤 3：尝试直接解析
    try {
      return JSON.parse(jsonStr);
    } catch (e1) {
      console.warn('[DEBUG] 直接解析失败，尝试修复:', e1.message);

      // 步骤 4：尝试修复常见的 JSON 截断问题
      // 4a. 如果 JSON 在数组中间被截断，尝试补全
      var fixed = jsonStr;

      // 统计括号匹配
      var openBraces = (fixed.match(/\{/g) || []).length;
      var closeBraces = (fixed.match(/\}/g) || []).length;
      var openBrackets = (fixed.match(/\[/g) || []).length;
      var closeBrackets = (fixed.match(/\]/g) || []).length;

      console.log('[DEBUG] Braces: open=' + openBraces + ', close=' + closeBraces +
                  ', Brackets: open=' + openBrackets + ', close=' + closeBrackets);

      // 补全缺失的右括号
      while (closeBraces < openBraces) {
        fixed += '}';
        closeBraces++;
      }
      while (closeBrackets < openBrackets) {
        fixed += ']';
        closeBrackets++;
      }

      // 4b. 尝试修复末尾缺少逗号的情况（如 "explanation": "..." 后面没有逗号）
      // 在最后一个属性值后面如果没有逗号但有换行，添加逗号
      fixed = fixed.replace(/("[^"]*")\s*\n\s*(\})/g, '$1,\n$2');

      // 4c. 尝试修复数组元素之间缺少逗号
      fixed = fixed.replace(/(\})\s*\n\s*(\{)/g, '$1,\n$2');

      try {
        return JSON.parse(fixed);
      } catch (e2) {
        console.warn('[DEBUG] 修复后仍解析失败:', e2.message);
        console.warn('[DEBUG] Fixed JSON preview:', fixed.substring(fixed.length - 300));

        // 步骤 5：如果还是失败，尝试提取已解析的部分作为 fallback
        // 尝试找到 questions 数组并解析
        var questionsMatch = fixed.match(/"questions"\s*:\s*(\[[\s\S]*\])/);
        if (questionsMatch) {
          try {
            var questions = JSON.parse(questionsMatch[1]);
            return {
              subject: '未知学科',
              type: '未知题型',
              questions: questions
            };
          } catch (e3) {
            console.warn('[DEBUG] questions 数组解析也失败');
          }
        }

        throw new Error('AI 返回的 JSON 格式严重损坏，无法修复解析。请检查图片清晰度或重试。');
      }
    }
  },

  /**
   * 将图片文件转为 Base64
   * @param {File} file - 图片文件
   * @returns {Promise<string>} Base64 字符串（不含 data:image 前缀）
   */
  fileToBase64: function(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var base64 = e.target.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * 将 DataURL 转为 Base64（不含前缀）
   */
  dataUrlToBase64: function(dataUrl) {
    return dataUrl.split(',')[1];
  },

  /**
   * 从 DataURL 中提取实际的 MIME 类型
   * 例如：'data:image/png;base64,...' → 'image/png'
   */
  dataUrlToMime: function(dataUrl) {
    var match = dataUrl.match(/^data:([^;]+);/);
    return match ? match[1] : 'image/jpeg';
  }
};