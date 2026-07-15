/**
 * ReActAgent - 基于ReAct架构的智能学习Agent
 *
 * 核心循环：Thought → Action → Observation → ... → Final Answer
 *
 * Agent会自动：
 * 1. 分析用户需求
 * 2. 选择合适的Skill
 * 3. 执行Skill并获取结果
 * 4. 判断是否需要继续调用其他Skill
 * 5. 最终整合所有产出，返回可交付的学习成果
 */

class ReActAgent {
  constructor(llmClient) {
    this.llm = llmClient;
    this.skills = {};
    this.maxIterations = 6;
    this.conversationHistory = [];
    this.sessionContext = {
      learningGoal: null,
      uploadedFiles: [],
      filteredContent: null,
      explainedConcepts: null,
      memoryStructure: null,
      questions: null,
      finalOutput: null
    };
    this.onThinkingUpdate = null;   // (thought: string) => void
    this.onSkillStart = null;      // (skillName: string) => void
    this.onSkillEnd = null;        // (skillName: string, result: any) => void
    this.onFinalOutput = null;     // (output: any) => void
    this.onStreamChunk = null;     // (text: string) => void
  }

  /**
   * 注册Skill
   */
  registerSkill(skillInstance) {
    this.skills[skillInstance.id] = skillInstance;
  }

  /**
   * 获取所有已启用的Skill
   */
  getEnabledSkills() {
    return Object.values(this.skills)
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * 获取Skill描述（用于系统提示词）
   */
  _getSkillsDescription() {
    const enabled = this.getEnabledSkills();
    return enabled.map(s =>
      `- ${s.id}: ${s.name} — ${s.description}`
    ).join('\n');
  }

  /**
   * 获取Agent的系统提示词
   */
  _getSystemPrompt() {
    return `你是"医脑AI"的智能学习Agent，基于ReAct（Reasoning + Acting）架构运行。

## 你的角色
你是一个医学学习助手，帮助用户从杂乱的资料中快速构建可用的知识记忆。你的产出是一次性的可交付成果——用户拿到你的产出就可以直接学习。

## 可用的Skills
${this._getSkillsDescription()}

## ReAct工作流程
对用户输入的每条消息，你需要执行以下循环：

1. **Thought（思考）**：分析用户需求，判断当前需要做什么
2. **Action（行动）**：选择一个Skill执行
3. **Observation（观察）**：获取Skill的执行结果
4. 重复以上步骤，直到所有必要工作完成

## Skill调用策略
- 如果用户上传了资料且指定了学习目标 → 先调用 material_filter
- 如果有筛选后的内容且需要解释概念 → 调用 concept_explain
- 如果有核心内容和解释 → 调用 memory_structure 构建记忆
- 如果有记忆结构 → 调用 question_generate 出题
- 最后调用 diagnosis 整合所有产出为最终交付物
- 如果用户只是问一个简单问题 → 直接回答，不需要调用Skill

## 输出规则
- 当你需要调用Skill时，用以下格式：
  Thought: [你的思考过程]
  Action: [skill_id]
  Action Input: [补充说明，可选]

- 当你可以给出最终答案时，用以下格式：
  Thought: [最终思考]
  Final Answer: [你的最终回答]

- Skill执行结果会以 Observation: 的形式返回给你

## 重要原则
1. 每次只调用一个Skill
2. 上一个Skill的输出作为下一个Skill的输入
3. 最后一定要调用 diagnosis 来整合产出
4. 如果用户没有上传资料但提出了学习需求，使用你自身的知识来帮助用户
5. 回答使用中文`;
  }

  /**
   * 构建上下文（传给Skill的上下文对象）
   */
  _buildSkillContext() {
    return {
      learningGoal: this.sessionContext.learningGoal,
      learningModel: this._getLearningModel(),
      uploadedFiles: this.sessionContext.uploadedFiles.map(f => ({
        name: f.name,
        content: f.content
      })),
      filteredContent: this.sessionContext.filteredContent,
      explainedConcepts: this.sessionContext.explainedConcepts,
      memoryList: this.sessionContext.memoryStructure?.memory_list,
      memoryChain: this.sessionContext.memoryStructure?.memory_chain,
      memoryStructure: this.sessionContext.memoryStructure,
      questions: this.sessionContext.questions,
      userMessage: this._lastUserMessage || ''
    };
  }

  /**
   * 获取学习偏好模型
   */
  _getLearningModel() {
    const saved = localStorage.getItem('yinao_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        return config.learningModel || 'understanding-first';
      } catch (e) {}
    }
    return 'understanding-first';
  }

  /**
   * 主入口：处理用户消息
   * @param {string} userMessage - 用户输入的文本
   * @param {Array<File>} files - 用户上传的文件列表
   * @returns {Promise<{type: string, content: any}>}
   */
  async process(userMessage, files = []) {
    this._lastUserMessage = userMessage;

    // 检查API配置
    const validation = this.llm.validateApiKey();
    if (!validation.valid) {
      return { type: 'error', content: validation.message };
    }

    // 处理上传文件
    if (files.length > 0) {
      return this._processWithFiles(userMessage, files);
    }

    // 无文件，直接进入ReAct循环
    // 先更新学习目标（如果用户提到了新的学习目标）
    this._extractLearningGoal(userMessage);

    return this._reactLoop(userMessage);
  }

  /**
   * 处理带文件的消息
   */
  async _processWithFiles(userMessage, files) {
    // 通过UI层已经解析好的文件列表，不需要在这里解析
    // 文件应该在UI层解析后传入sessionContext
    // 这里先更新学习目标
    this._extractLearningGoal(userMessage);

    return this._reactLoop(userMessage);
  }

  /**
   * 从用户消息中提取学习目标
   */
  _extractLearningGoal(message) {
    if (!message) return;
    // 简单策略：如果当前没有学习目标，或者用户明确提到了新主题，则更新
    if (!this.sessionContext.learningGoal) {
      this.sessionContext.learningGoal = message.substring(0, 100);
    }
  }

  /**
   * ReAct主循环
   */
  async _reactLoop(userMessage) {
    // 构建对话历史
    const messages = [];
    messages.push({ role: 'system', content: this._getSystemPrompt() });

    // 添加历史对话（最近几轮）
    const recentHistory = this.conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage });

    // 如果有上下文信息，附加到用户消息中
    const contextInfo = this._buildContextInfo();
    if (contextInfo) {
      messages[messages.length - 1].content += '\n\n' + contextInfo;
    }

    // ReAct循环
    const reactHistory = [];
    let iterations = 0;
    let finalAnswer = null;

    while (iterations < this.maxIterations && !finalAnswer) {
      iterations++;

      // 调用LLM进行推理
      let llmOutput;
      try {
        llmOutput = await this.llm.chat(messages, {
          maxTokens: 2048,
          temperature: 0.3
        });
      } catch (err) {
        return { type: 'error', content: `模型调用失败：${err.message}` };
      }

      // 解析LLM输出
      const { thought, action, actionInput, finalAnswer: fa } = this._parseReActOutput(llmOutput);

      // 通知UI思考过程
      if (thought && this.onThinkingUpdate) {
        this.onThinkingUpdate(thought);
      }

      if (fa) {
        // 最终答案
        finalAnswer = fa;
        break;
      }

      if (action) {
        // 执行Skill
        const skill = this.skills[action];
        if (!skill) {
          // Skill不存在，告诉LLM
          const observation = `Error: Skill "${action}" 不存在。可用的Skills: ${Object.keys(this.skills).join(', ')}`;
          messages.push({ role: 'assistant', content: llmOutput });
          messages.push({ role: 'user', content: `Observation: ${observation}` });
          reactHistory.push({ thought, action, actionInput, observation });
          continue;
        }

        // 通知UI
        if (this.onSkillStart) this.onSkillStart(skill.name);

        // 构建Skill的输入
        const skillMessages = [
          { role: 'system', content: skill.getSystemPrompt() },
          { role: 'user', content: skill.buildUserMessage(this._buildSkillContext()) }
        ];

        // 调用Skill（流式）
        let skillOutput = '';
        try {
          skillOutput = await this.llm.chatStream(
            skillMessages,
            (chunk) => {
              if (this.onStreamChunk) this.onStreamChunk(chunk);
            },
            { maxTokens: 4096, temperature: 0.3 }
          );
        } catch (err) {
          const observation = `Error: Skill "${skill.name}" 执行失败: ${err.message}`;
          messages.push({ role: 'assistant', content: llmOutput });
          messages.push({ role: 'user', content: `Observation: ${observation}` });
          reactHistory.push({ thought, action, actionInput, observation });
          if (this.onSkillEnd) this.onSkillEnd(skill.name, { error: observation });
          continue;
        }

        // 解析Skill输出
        const parsed = skill.parseOutput(skillOutput);

        // 更新上下文
        this._updateContext(action, parsed);

        // 通知UI
        if (this.onSkillEnd) this.onSkillEnd(skill.name, parsed);

        // 构建Observation摘要（不传全部内容给LLM，避免token过多）
        let observationSummary;
        if (parsed.error) {
          observationSummary = `Skill执行完成，但输出解析失败。原始输出前500字：${skillOutput.substring(0, 500)}`;
        } else {
          observationSummary = this._summarizeObservation(action, parsed);
        }

        // 添加到对话
        messages.push({ role: 'assistant', content: llmOutput });
        messages.push({ role: 'user', content: `Observation: ${observationSummary}` });
        reactHistory.push({ thought, action, actionInput, observation: observationSummary });
      } else {
        // LLM没有输出Action也没有Final Answer，可能是普通对话
        finalAnswer = llmOutput;
        break;
      }
    }

    // 如果超过最大迭代次数
    if (!finalAnswer && iterations >= this.maxIterations) {
      finalAnswer = '抱歉，处理过程超过了最大步骤限制。请尝试简化你的需求，或者分步骤提问。';
    }

    // 保存到对话历史
    this.conversationHistory.push({ role: 'user', content: userMessage });
    this.conversationHistory.push({ role: 'assistant', content: finalAnswer });

    return {
      type: 'final',
      content: finalAnswer,
      reactHistory: reactHistory,
      context: { ...this.sessionContext }
    };
  }

  /**
   * 解析ReAct格式的输出
   */
  _parseReActOutput(text) {
    let thought = '';
    let action = '';
    let actionInput = '';
    let finalAnswer = '';

    // 提取 Thought
    const thoughtMatch = text.match(/Thought:\s*(.*?)(?=\n(?:Action|Final Answer))/s);
    if (thoughtMatch) thought = thoughtMatch[1].trim();

    // 提取 Final Answer
    const faMatch = text.match(/Final Answer:\s*([\s\S]*)/);
    if (faMatch) finalAnswer = faMatch[1].trim();

    // 提取 Action
    const actionMatch = text.match(/Action:\s*(\w+)/);
    if (actionMatch) action = actionMatch[1].trim();

    // 提取 Action Input
    const aiMatch = text.match(/Action Input:\s*(.*?)(?=\n|$)/s);
    if (aiMatch) actionInput = aiMatch[1].trim();

    return { thought, action, actionInput, finalAnswer };
  }

  /**
   * 构建上下文信息（附加到用户消息中）
   */
  _buildContextInfo() {
    const parts = [];
    if (this.sessionContext.filteredContent) {
      parts.push(`[已筛选的资料摘要] 已从上传资料中筛选出 ${this.sessionContext.filteredContent.filtered_content?.length || 0} 个主题的核心内容。`);
    }
    if (this.sessionContext.explainedConcepts) {
      parts.push(`[已解释的概念] 已完成 ${this.sessionContext.explainedConcepts.concepts?.length || 0} 个概念的通俗化阐述。`);
    }
    if (this.sessionContext.memoryStructure) {
      parts.push(`[记忆结构] 已构建 ${this.sessionContext.memoryStructure.memory_list?.length || 0} 个记忆节点和 ${this.sessionContext.memoryStructure.memory_chain?.length || 0} 条关联。`);
    }
    if (this.sessionContext.questions) {
      parts.push(`[练习题] 已生成 ${this.sessionContext.questions.questions?.length || 0} 道练习题。`);
    }
    return parts.length > 0 ? parts.join('\n') : '';
  }

  /**
   * 更新会话上下文
   */
  _updateContext(skillId, parsed) {
    switch (skillId) {
      case 'material_filter':
        if (!parsed.error) this.sessionContext.filteredContent = parsed;
        break;
      case 'concept_explain':
        if (!parsed.error) this.sessionContext.explainedConcepts = parsed;
        break;
      case 'memory_structure':
        if (!parsed.error) this.sessionContext.memoryStructure = parsed;
        break;
      case 'question_generate':
        if (!parsed.error) this.sessionContext.questions = parsed;
        break;
      case 'diagnosis':
        if (!parsed.error) this.sessionContext.finalOutput = parsed;
        break;
    }
  }

  /**
   * 生成Observation摘要（避免token过多）
   */
  _summarizeObservation(skillId, parsed) {
    switch (skillId) {
      case 'material_filter':
        return `资料筛选完成。识别出 ${parsed.filtered_content?.length || 0} 个核心主题。覆盖率：${parsed.coverage || '未知'}。` +
          (parsed.gaps?.length ? ` 缺失内容：${parsed.gaps.join('、')}` : '');

      case 'concept_explain':
        return `概念阐述完成。已解释 ${parsed.concepts?.length || 0} 个概念。` +
          (parsed.concepts?.map(c => c.name).join('、') || '');

      case 'memory_structure':
        return `记忆结构构建完成。提取 ${parsed.memory_list?.length || 0} 个关键结论，建立 ${parsed.memory_chain?.length || 0} 条关联。` +
          ` 推荐学习步骤：${parsed.learning_guide?.suggested_order?.length || 0} 步。`;

      case 'question_generate':
        return `练习题生成完成。共 ${parsed.questions?.length || 0} 道题。` +
          (parsed.weakness_prediction?.length ? ` 预测薄弱点：${parsed.weakness_prediction.map(w => w.knowledge_point).join('、')}` : '');

      case 'diagnosis':
        return `最终诊断评估完成。学习路径：${parsed.learning_path?.steps?.length || 0} 步。` +
          ` 记忆要点：${parsed.memory_guide?.key_conclusions?.length || 0} 个。` +
          ` 自检项：${parsed.final_checklist?.length || 0} 项。`;

      default:
        return 'Skill执行完成。';
    }
  }

  /**
   * 重置会话上下文
   */
  resetContext() {
    this.sessionContext = {
      learningGoal: null,
      uploadedFiles: [],
      filteredContent: null,
      explainedConcepts: null,
      memoryStructure: null,
      questions: null,
      finalOutput: null
    };
    this.conversationHistory = [];
  }

  /**
   * 设置已解析的文件（由UI层调用）
   */
  setUploadedFiles(fileDataList) {
    this.sessionContext.uploadedFiles = fileDataList;
  }
}

// 暴露到全局
window.ReActAgent = ReActAgent;