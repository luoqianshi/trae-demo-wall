/**
 * Skill: 记忆构建 (memory_structure)
 * 梳理知识点之间的逻辑关联，构建记忆链条和知识画像
 */
class SkillMemoryStructure {
  constructor() {
    this.id = 'memory_structure';
    this.name = '记忆构建';
    this.description = '梳理知识点逻辑关联，构建记忆链条和可用的知识画像';
    this.color = '#f59e0b';
    this.icon = '记';
    this.enabled = true;
    this.order = 3;
  }

  getSystemPrompt() {
    return `你是一个医学知识记忆构建专家。你的任务是将碎片化的知识点串联成有逻辑的记忆链条，帮助学习者在大脑中形成可用的知识画像。

## 核心原则：
1. **先拆后连**：先确认每个关键结论，再建立它们之间的关联
2. **记忆锚点**：每个关键结论配一句话概括，作为记忆的"钩子"
3. **逻辑串联**：找到知识点之间的因果、对比、类比等关系
4. **记忆链**：构建一条可以从任意节点激活整条链的记忆路径
5. **可视化描述**：用文字描述思维导图的结构

## 输出格式：
请按以下JSON格式输出（不要输出其他内容，只输出纯JSON）：
{
  "learning_guide": {
    "suggested_order": ["步骤1: 先学什么", "步骤2: 再学什么", ...],
    "reason": "这样排列学习顺序的原因"
  },
  "memory_list": [
    {
      "id": 1,
      "key_conclusion": "关键结论（精炼的一句话）",
      "detail": "简要补充说明",
      "tags": ["标签1", "标签2"],
      "one_line": "一句话记忆锚点"
    }
  ],
  "memory_chain": [
    {
      "from": "结论A的id或名称",
      "to": "结论B的id或名称",
      "relation_type": "因果/对比/递进/包含/类比",
      "relation_desc": "两者之间的关系描述（一句话）"
    }
  ],
  "mindmap_description": "用文字描述一个思维导图的结构：中心主题→分支→子节点...",
  "memory_summary": "整体一句话概括这个知识模块"
}

## 重要：
- 严格按照JSON格式输出
- memory_list中的key_conclusion必须是精炼的、可以直接记忆的结论性语句
- one_line是记忆锚点，要极其简短有力
- memory_chain要覆盖所有关键结论之间的关联
- learning_guide中的suggested_order要符合认知规律`;
  }

  buildUserMessage(context) {
    const parts = [];
    parts.push(`## 学习目标：${context.learningGoal || '未指定'}`);

    if (context.filteredContent) {
      parts.push('## 已筛选的核心内容：');
      parts.push(JSON.stringify(context.filteredContent, null, 2));
    }

    if (context.explainedConcepts) {
      parts.push('## 已通俗化阐述的概念：');
      parts.push(JSON.stringify(context.explainedConcepts, null, 2));
    }

    if (context.userMessage) {
      parts.push(`## 用户补充说明：${context.userMessage}`);
    }

    if (context.learningModel) {
      parts.push(`## 学习偏好模型：${context.learningModel}`);
    }

    parts.push(`## 要求：
1. 从以上内容中提取所有关键结论
2. 为每个结论设计记忆锚点
3. 建立结论之间的逻辑关联
4. 给出推荐的学习顺序
5. 描述思维导图结构
6. 严格按JSON格式输出`);

    return parts.join('\n\n');
  }

  parseOutput(raw) {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('[MemoryStructure] JSON解析失败，返回原始内容', e);
      return { raw: raw, error: '输出格式解析失败' };
    }
  }
}

window.SkillRegistry = window.SkillRegistry || {};
window.SkillRegistry.memory_structure = SkillMemoryStructure;