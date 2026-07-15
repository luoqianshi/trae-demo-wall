/**
 * Skill: 智能出题 (question_generate)
 * 生成针对性练习题，检验理解和记忆是否正确
 */
class SkillQuestionGenerate {
  constructor() {
    this.id = 'question_generate';
    this.name = '智能出题';
    this.description = '生成针对性练习题，检验理解是否正确、记忆是否牢固';
    this.color = '#ef4444';
    this.icon = '题';
    this.enabled = true;
    this.order = 4;
  }

  getSystemPrompt() {
    return `你是一个医学考试出题专家。你的任务是基于学习内容生成高质量的练习题，帮助学习者检验理解和记忆。

## 出题原则：
1. **针对性**：题目必须精确对应关键知识点，不偏题
2. **梯度设计**：从理解→应用→综合，题目难度递增
3. **选项设计**：干扰项要有迷惑性，来自常见的误解
4. **解析详细**：每道题给出详细解析，说明为什么对、为什么错
5. **覆盖全面**：尽量覆盖所有关键结论

## 题型：
- 单选题（4个选项，1个正确答案）
- 判断题（对/错）

## 输出格式：
请按以下JSON格式输出（不要输出其他内容，只输出纯JSON）：
{
  "questions": [
    {
      "id": 1,
      "type": "single_choice",
      "difficulty": "easy/medium/hard",
      "target_knowledge": "这道题考查的关键结论",
      "question": "题目内容",
      "options": {
        "A": "选项A",
        "B": "选项B",
        "C": "选项C",
        "D": "选项D"
      },
      "answer": "A",
      "explanation": "详细解析：为什么选A，其他选项为什么错",
      "memory_tip": "做这道题时应该想到的记忆锚点"
    }
  ],
  "weakness_prediction": [
    {
      "knowledge_point": "知识点",
      "predicted_difficulty": "预测学习者在这里会出错的概率（高/中/低）",
      "reason": "预测理由"
    }
  ]
}

## 重要：
- 严格按照JSON格式输出
- 生成5-8道题，覆盖不同难度
- 干扰选项要来自典型误解，不要随意编造
- explanation要有教学价值，帮助加深理解
- weakness_prediction基于常见的学习难点判断`;
  }

  buildUserMessage(context) {
    const parts = [];
    parts.push(`## 学习目标：${context.learningGoal || '未指定'}`);

    if (context.filteredContent) {
      parts.push('## 学习内容（已筛选）：');
      parts.push(JSON.stringify(context.filteredContent, null, 2));
    }

    if (context.memoryList) {
      parts.push('## 记忆清单（关键结论）：');
      parts.push(JSON.stringify(context.memoryList, null, 2));
    }

    if (context.memoryChain) {
      parts.push('## 知识关联链条：');
      parts.push(JSON.stringify(context.memoryChain, null, 2));
    }

    if (context.userMessage) {
      parts.push(`## 用户补充说明：${context.userMessage}`);
    }

    parts.push(`## 要求：
1. 基于以上学习内容，生成5-8道针对性练习题
2. 题目要覆盖所有关键结论
3. 难度从易到难排列
4. 每道题都要有详细解析
5. 预测学习者可能在哪些知识点出错
6. 严格按JSON格式输出`);

    return parts.join('\n\n');
  }

  parseOutput(raw) {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('[QuestionGenerate] JSON解析失败，返回原始内容', e);
      return { raw: raw, error: '输出格式解析失败' };
    }
  }
}

window.SkillRegistry = window.SkillRegistry || {};
window.SkillRegistry.question_generate = SkillQuestionGenerate;