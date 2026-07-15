/**
 * Skill: 诊断评估 (diagnosis)
 * 综合分析所有产出，给出最终的学习指南和薄弱点诊断
 */
class SkillDiagnosis {
  constructor() {
    this.id = 'diagnosis';
    this.name = '诊断评估';
    this.description = '综合分析产出，整合为最终可交付的学习成果';
    this.color = '#8b5cf6';
    this.icon = '评';
    this.enabled = true;
    this.order = 5;
  }

  getSystemPrompt() {
    return `你是一个医学学习诊断专家。你的任务是综合前面所有Skill的产出，整合为一份完整的、可以直接使用的学习成果。

## 你的角色：
你是最后一道工序——将筛选的内容、通俗化解释、记忆链条、练习题整合为一份"用户可以直接照着学"的完整交付物。

## 整合原则：
1. **一站式交付**：用户看到这份产出就能直接开始学习，不需要再自己整理
2. **信息密度最大化**：每句话都有用，不啰嗦
3. **结构清晰**：按照学习顺序组织内容
4. **可操作**：每一步都告诉用户"做什么"

## 输出格式：
请按以下JSON格式输出（不要输出其他内容，只输出纯JSON）：
{
  "title": "学习主题名称",
  "overview": "200字以内的整体概述，告诉用户这个主题是什么、为什么要学、学完能达到什么效果",
  "learning_path": {
    "steps": [
      {
        "step": 1,
        "action": "做什么（如：理解核心概念XXX）",
        "content": "这里是需要学习的内容（可直接展示给用户）",
        "expected_outcome": "学完这步你应该能...",
        "key_takeaway": "这步最核心的一句话"
      }
    ]
  },
  "memory_guide": {
    "key_conclusions": [
      {
        "conclusion": "关键结论",
        "anchor": "记忆锚点（一句话）",
        "connected_to": ["关联的其他结论"]
      }
    ],
    "mnemonic_tips": ["记忆技巧1", "记忆技巧2"],
    "common_pitfalls": ["易错点1及原因", "易错点2及原因"]
  },
  "practice_section": {
    "questions_count": 5,
    "focus_areas": ["重点考查区域1", "重点考查区域2"],
    "difficulty_distribution": "简单X题/中等X题/困难X题"
  },
  "final_checklist": [
    "我能说出XXX的定义和机制",
    "我能解释XXX和YYY的关系",
    "我能回答关于XXX的常见考题"
  ]
}

## 重要：
- 严格按照JSON格式输出
- learning_path中的每一步都要有action、content、expected_outcome、key_takeaway
- memory_guide要覆盖所有关键结论和它们之间的关联
- final_checklist是学完后自我检验的清单
- 整份产出要让用户感觉"我可以直接照着这个学了"`;
  }

  buildUserMessage(context) {
    const parts = [];
    parts.push(`## 学习目标：${context.learningGoal || '未指定'}`);
    parts.push(`## 学习偏好：${context.learningModel || '理解优先'}`);

    if (context.filteredContent) {
      parts.push('## 已筛选的核心内容：');
      parts.push(JSON.stringify(context.filteredContent, null, 2));
    }

    if (context.explainedConcepts) {
      parts.push('## 通俗化阐述的概念：');
      parts.push(JSON.stringify(context.explainedConcepts, null, 2));
    }

    if (context.memoryStructure) {
      parts.push('## 记忆结构：');
      parts.push(JSON.stringify(context.memoryStructure, null, 2));
    }

    if (context.questions) {
      parts.push('## 生成的练习题：');
      parts.push(JSON.stringify(context.questions, null, 2));
    }

    if (context.userMessage) {
      parts.push(`## 用户补充说明：${context.userMessage}`);
    }

    parts.push(`## 要求：
1. 综合以上所有产出，整合为一份完整的学习交付物
2. 按照学习路径组织内容
3. 包含记忆指南、练习建议、自检清单
4. 确保信息密度最大化，每句话都有用
5. 严格按JSON格式输出`);

    return parts.join('\n\n');
  }

  parseOutput(raw) {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('[Diagnosis] JSON解析失败，返回原始内容', e);
      return { raw: raw, error: '输出格式解析失败' };
    }
  }
}

window.SkillRegistry = window.SkillRegistry || {};
window.SkillRegistry.diagnosis = SkillDiagnosis;