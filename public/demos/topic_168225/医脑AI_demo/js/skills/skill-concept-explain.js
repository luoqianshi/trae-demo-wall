/**
 * Skill: 概念阐述 (concept_explain)
 * 用通俗化语言和多角度解释，帮助用户建立对难懂概念的直觉理解
 */
class SkillConceptExplain {
  constructor() {
    this.id = 'concept_explain';
    this.name = '概念阐述';
    this.description = '用通俗语言和多角度解释难懂概念，帮助建立直觉理解';
    this.color = '#10b981';
    this.icon = '解';
    this.enabled = true;
    this.order = 2;
  }

  getSystemPrompt() {
    return `你是一个擅长把复杂医学概念讲通俗的医学教育专家。你的任务是将难懂的医学概念用多种方式解释清楚，帮助学习者建立直觉。

## 核心原则：
1. **先给直觉**：用日常类比或生活经验建立初步印象
2. **再给定义**：给出准确的医学定义
3. **多角度解释**：至少从2-3个角度（机制、临床、类比）解释同一概念
4. **点明误区**：指出学习者容易犯的典型理解错误
5. **控制深度**：先用简单语言讲清，再逐步深入细节

## 输出格式：
请按以下JSON格式输出（不要输出其他内容，只输出纯JSON）：
{
  "concepts": [
    {
      "name": "概念名称",
      "intuition": "用一句话+日常类比给出直觉理解",
      "definition": "准确的医学/专业定义",
      "multi_angle_explanations": [
        {
          "angle": "角度名称（如：机制角度/临床角度/类比角度）",
          "explanation": "该角度下的详细解释"
        }
      ],
      "common_misunderstandings": [
        {
          "mistake": "常见错误理解",
          "correction": "正确理解"
        }
      ],
      "one_line_summary": "一句话记忆锚点"
    }
  ]
}

## 重要：
- 严格按照JSON格式输出
- intuition必须用生活中的类比，让人一听就懂
- multi_angle_explanations至少提供2个角度
- one_line_summary要简短有力，适合作为记忆锚点`;
  }

  buildUserMessage(context) {
    const parts = [];
    parts.push(`## 学习目标：${context.learningGoal || '未指定'}`);

    // 如果有筛选后的资料，优先使用
    if (context.filteredContent) {
      parts.push('## 已筛选的资料内容：');
      parts.push(JSON.stringify(context.filteredContent, null, 2));
    }

    // 用户可能直接要求解释某个概念
    if (context.userMessage) {
      parts.push(`## 需要解释的内容：${context.userMessage}`);
    }

    // 如果用户没有指定具体概念，要求模型从资料中识别难懂概念
    parts.push(`## 要求：
1. 从以上内容中识别出最难理解的概念
2. 对每个概念进行通俗化阐述
3. 严格按JSON格式输出`);

    return parts.join('\n\n');
  }

  parseOutput(raw) {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('[ConceptExplain] JSON解析失败，返回原始内容', e);
      return { raw: raw, error: '输出格式解析失败' };
    }
  }
}

window.SkillRegistry = window.SkillRegistry || {};
window.SkillRegistry.concept_explain = SkillConceptExplain;