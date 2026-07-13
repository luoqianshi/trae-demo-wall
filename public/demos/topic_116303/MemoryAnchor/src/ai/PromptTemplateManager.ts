import { PromptTemplate, AITaskType } from './types';

const DEFAULT_SUMMARY_TEMPLATE: PromptTemplate = {
  id: 'summary-default',
  name: '默认摘要模板',
  type: 'summary',
  systemPrompt: 'You are a professional content summarization expert. Please read the following article content and generate a 100-300 character Chinese summary.\n\nRequirements:\n1. Accurately summarize the core content and main viewpoints of the article\n2. Retain key data and important conclusions\n3. Use concise and fluent language with clear logic\n4. Do not include information not present in the original text',
  userPromptTemplate: 'Article Title: {title}\nArticle Content:\n{content}\n\nPlease output the summary:',
  variables: ['title', 'content'],
  defaultValues: {
    maxLength: 300,
    style: 'concise',
  },
};

const DEFAULT_TAGS_TEMPLATE: PromptTemplate = {
  id: 'tags-default',
  name: '默认标签模板',
  type: 'tags',
  systemPrompt: 'Please generate 3-8 Chinese tags for the following article. The tags should accurately reflect the article\'s theme and content.\n\nRequirements:\n1. Tags should be nouns or noun phrases\n2. Sort by importance from high to low\n3. Cover the main domains, technologies, themes, etc. of the article\n4. Avoid overly broad or overly specific tags',
  userPromptTemplate: 'Article Title: {title}\nArticle Summary: {summary}\n\nPlease output tags in JSON array format, for example: ["tag1", "tag2", "tag3"]',
  variables: ['title', 'summary'],
  defaultValues: {
    maxTags: 8,
  },
};

const DEFAULT_KEY_POINTS_TEMPLATE: PromptTemplate = {
  id: 'keyPoints-default',
  name: '默认关键要点模板',
  type: 'keyPoints',
  systemPrompt: 'Please extract 3-5 core viewpoints or key information points from the following article.\n\nRequirements:\n1. Each point should be a complete sentence\n2. Accurately reflect the core content of the article\n3. Sort by importance\n4. Use concise and clear language',
  userPromptTemplate: 'Article Title: {title}\nArticle Content:\n{content}\n\nPlease output in JSON array format, for example: ["point1", "point2", "point3"]',
  variables: ['title', 'content'],
  defaultValues: {
    maxPoints: 5,
  },
};

export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();
  private defaultTemplates: Map<AITaskType, string> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    this.registerTemplate(DEFAULT_SUMMARY_TEMPLATE);
    this.registerTemplate(DEFAULT_TAGS_TEMPLATE);
    this.registerTemplate(DEFAULT_KEY_POINTS_TEMPLATE);

    this.setDefaultTemplate('summary', DEFAULT_SUMMARY_TEMPLATE.id);
    this.setDefaultTemplate('tags', DEFAULT_TAGS_TEMPLATE.id);
    this.setDefaultTemplate('keyPoints', DEFAULT_KEY_POINTS_TEMPLATE.id);
  }

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  unregisterTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  getDefaultTemplate(taskType: AITaskType): PromptTemplate | undefined {
    const defaultId = this.defaultTemplates.get(taskType);
    if (!defaultId) return undefined;
    return this.templates.get(defaultId);
  }

  setDefaultTemplate(taskType: AITaskType, templateId: string): void {
    const template = this.templates.get(templateId);
    if (!template || template.type !== taskType) {
      throw new Error(`Template ${templateId} not found or type mismatch`);
    }
    this.defaultTemplates.set(taskType, templateId);
  }

  getTemplatesByType(taskType: AITaskType): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(
      (template) => template.type === taskType
    );
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  renderTemplate(
    templateId: string,
    variables: Record<string, string>
  ): { systemPrompt: string; userPrompt: string } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const systemPrompt = template.systemPrompt;
    let userPrompt = template.userPromptTemplate;

    for (const variable of template.variables) {
      const rawValue = variables[variable] ?? template.defaultValues[variable] ?? '';
      const value =
        typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);
      userPrompt = userPrompt.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    }

    return { systemPrompt, userPrompt };
  }

  renderDefaultTemplate(
    taskType: AITaskType,
    variables: Record<string, string>
  ): { systemPrompt: string; userPrompt: string } {
    const template = this.getDefaultTemplate(taskType);
    if (!template) {
      throw new Error(`No default template for task type ${taskType}`);
    }

    return this.renderTemplate(template.id, variables);
  }

  createCustomTemplate(
    id: string,
    name: string,
    type: AITaskType,
    systemPrompt: string,
    userPromptTemplate: string,
    variables: string[],
    defaultValues: Record<string, unknown> = {}
  ): PromptTemplate {
    const template: PromptTemplate = {
      id,
      name,
      type,
      systemPrompt,
      userPromptTemplate,
      variables,
      defaultValues,
    };

    this.registerTemplate(template);
    return template;
  }

  updateTemplate(
    templateId: string,
    updates: Partial<PromptTemplate>
  ): PromptTemplate | undefined {
    const existing = this.templates.get(templateId);
    if (!existing) return undefined;

    const updated: PromptTemplate = {
      ...existing,
      ...updates,
      id: existing.id,
      type: existing.type,
    };

    this.templates.set(templateId, updated);
    return updated;
  }

  exportTemplates(): PromptTemplate[] {
    return this.getAllTemplates();
  }

  importTemplates(templates: PromptTemplate[]): void {
    for (const template of templates) {
      this.registerTemplate(template);
    }
  }

  validateTemplate(template: PromptTemplate): boolean {
    if (!template.id || !template.name || !template.type) return false;
    if (!template.systemPrompt || !template.userPromptTemplate) return false;
    if (!Array.isArray(template.variables) || template.variables.length === 0) return false;

    const variablePattern = /\{(\w+)\}/g;
    let match;
    const foundVariables = new Set<string>();

    while ((match = variablePattern.exec(template.userPromptTemplate)) !== null) {
      foundVariables.add(match[1]);
    }

    for (const variable of template.variables) {
      if (!foundVariables.has(variable)) {
        console.warn(`Template ${template.id}: variable ${variable} not found in template`);
      }
    }

    return true;
  }
}

export const promptTemplateManager = new PromptTemplateManager();