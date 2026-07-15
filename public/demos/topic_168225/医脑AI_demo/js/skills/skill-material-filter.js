/**
 * Skill: 资料筛选 (material_filter)
 * 从用户上传的资料中筛选出与学习目标高度相关的高质量核心内容
 */
class SkillMaterialFilter {
  constructor() {
    this.id = 'material_filter';
    this.name = '资料筛选';
    this.description = '从杂乱资料中筛选核心内容，去重去噪，提取学习目标相关的高质量信息';
    this.color = '#3b82f6';
    this.icon = '筛';
    this.enabled = true;
    this.order = 1;
  }

  getSystemPrompt() {
    return `你是一个专业的医学资料筛选助手。你的任务是从用户提供的资料中，筛选出与学习目标高度相关的核心内容。

## 工作规则：
1. **相关性优先**：只保留与学习目标直接相关的内容，去除无关信息
2. **质量把关**：优先保留权威来源（教材、教学大纲）的内容，课件和笔记作为补充
3. **去重去噪**：去除重复内容，去除格式噪音（页眉页脚、装饰文字等）
4. **结构化输出**：将筛选后的内容按主题分类整理

## 输出格式：
请按以下JSON格式输出（不要输出其他内容，只输出纯JSON）：
{
  "filtered_content": [
    {
      "topic": "主题名称",
      "source": "来源（如：教材/PPT/笔记）",
      "key_points": ["关键点1", "关键点2", ...],
      "importance": "high/medium/low",
      "summary": "一句话概括该主题的核心内容"
    }
  ],
  "coverage": "已覆盖的学习目标百分比估算",
  "gaps": ["资料中缺失的重要知识点", ...],
  "recommendation": "对后续学习的建议"
}

## 重要：
- 严格按照JSON格式输出
- key_points中的每一条都应该是可以直接用于记忆和理解的精炼结论
- importance基于该知识点在考试中的出现频率和重要性判断
- gaps列出资料中可能缺失但学习目标需要覆盖的内容`;
  }

  buildUserMessage(context) {
    const parts = [];
    parts.push(`## 学习目标：${context.learningGoal || '未指定'}`);
    if (context.learningModel) {
      parts.push(`## 学习偏好：${context.learningModel}`);
    }
    if (context.uploadedFiles && context.uploadedFiles.length > 0) {
      parts.push('## 用户上传的资料：');
      context.uploadedFiles.forEach((f, i) => {
        parts.push(`### 资料${i + 1}：${f.name}\n${f.content}`);
      });
    }
    if (context.userMessage) {
      parts.push(`## 用户补充说明：${context.userMessage}`);
    }
    parts.push('\n请根据以上资料，筛选出与学习目标最相关的核心内容。严格按JSON格式输出。');
    return parts.join('\n\n');
  }

  parseOutput(raw) {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('[MaterialFilter] JSON解析失败，返回原始内容', e);
      return { raw: raw, error: '输出格式解析失败，但内容可能仍然有用' };
    }
  }
}

// 注册到全局Skill注册表
window.SkillRegistry = window.SkillRegistry || {};
window.SkillRegistry.material_filter = SkillMaterialFilter;