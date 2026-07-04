/**
 * 项目数据类型定义
 */

/** 项目基本信息 */
export interface Project {
  id: string;
  name: string;
  customer: string;
  region: string;
  status: string;
  currentPhase: string;
  nextAction: string;
  imGroup: string;
  imContact: string;
  attachmentDir: string;
  isRecent: boolean;
  progressText?: string;
  attachmentsText?: string;
  progressList?: Progress[];
  attachmentList?: Attachment[];
  customFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/** 创建项目的输入数据 */
export interface CreateProjectInput {
  id?: string;
  name?: string;
  customer?: string;
  region?: string;
  status?: string;
  currentPhase?: string;
  nextAction?: string;
  imGroup?: string;
  imContact?: string;
  isRecent?: boolean;
  progressList?: Progress[];
  attachmentList?: Attachment[];
  customFields?: Record<string, string>;
  createdAt?: string;
}

/** 更新项目的输入数据 */
export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

/** 进展记录 */
export interface Progress {
  id: string;
  createdAt: string;
  content: string;
}

/** 创建进展的输入数据 */
export interface CreateProgressInput {
  projectId: string;
  id?: string;
  createdAt?: string;
  content: string;
}

/** 更新进展的输入数据 */
export interface UpdateProgressInput {
  projectId: string;
  id: string;
  content: string;
  createdAt?: string;
}

/** 附件记录 */
export interface Attachment {
  id: string;
  createdAt: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

/** 字段配置 */
export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  visible: boolean;
  orderIndex: number;
  options: string[];
  defaultValue: string;
  showInQuickAdd: boolean;
}

/** 字段类型 */
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect';

/** 创建字段的输入数据 */
export interface CreateFieldInput {
  key?: string;
  label: string;
  type: FieldType;
  visible?: boolean;
  orderIndex?: number;
  options?: string[];
  defaultValue?: string;
  showInQuickAdd?: boolean;
}

/** 更新字段的输入数据 */
export interface UpdateFieldInput extends Partial<CreateFieldInput> {
  key: string;
}

/** AI 配置 */
export interface AiConfig {
  id: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  promptTemplate: string;
}

/** 保存 AI 配置的输入数据 */
export interface SaveAiConfigInput {
  apiUrl: string;
  apiKey: string;
  model: string;
  promptTemplate: string;
}

/** AI 提取结果 */
export interface AiExtractResult {
  ok: boolean;
  error?: string;
  raw?: string;
  structured?: Record<string, any>;
  chatText?: string;
}

/** 进展模板 */
export interface ProgressTemplate {
  id: string;
  name: string;
  fields: TemplateField[];
  createdAt: string;
}

/** 模板字段 */
export interface TemplateField {
  key: string;
  label: string;
  type: string;
}

/** 创建模板的输入数据 */
export interface CreateTemplateInput {
  id?: string;
  name: string;
  fields: TemplateField[];
}

/** 更新模板的输入数据 */
export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
}

/** 知识库分类 */
export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  createdAt: string;
}

/** 创建分类的输入数据 */
export interface CreateCategoryInput {
  id?: string;
  name: string;
  description?: string;
  orderIndex?: number;
}

/** 更新分类的输入数据 */
export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

/** 知识库条目 */
export interface KnowledgeItem {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  tags: string[];
  filePaths: string[];
  createdAt: string;
  updatedAt: string;
}

/** 创建知识条目的输入数据 */
export interface CreateKnowledgeInput {
  categoryId: string;
  title: string;
  content?: string;
  tags?: string[];
  filePaths?: string[];
}

/** 更新知识条目的输入数据 */
export interface UpdateKnowledgeInput extends Partial<CreateKnowledgeInput> {
  id: string;
}

/** UI 设置 */
export interface UiSettings {
  id: string;
  defaultPage: PageType;
  theme: Theme;
  tableDensity: Density;
  cardOpacity: number;
  auroraEnabled: boolean;
  cardOpacityAlpha: number;
  demoModeEnabled: boolean;
}

/** 页面类型 */
export type PageType = 'quickAdd' | 'overview' | 'knowledge' | 'statistics' | 'settings';

/** 主题 */
export type Theme = 'light' | 'dark';

/** 表格密度 */
export type Density = 'small' | 'middle' | 'large';

/** 保存 UI 设置的输入数据 */
export interface SaveUiSettingsInput {
  defaultPage?: PageType;
  theme?: Theme;
  tableDensity?: Density;
  cardOpacity?: number;
  auroraEnabled?: boolean;
  cardOpacityAlpha?: number;
  demoModeEnabled?: boolean;
}

/** 统计图配置 */
export interface RegisteredStat {
  id: string;
  name: string;
  chartType: string;
  dataSource: string;
  config: Record<string, any>;
  orderIndex: number;
  enabled: boolean;
}

/** 创建统计图的输入数据 */
export interface CreateStatInput {
  id?: string;
  name: string;
  chartType: string;
  dataSource: string;
  config?: Record<string, any>;
  orderIndex?: number;
  enabled?: boolean;
}

/** 更新统计图的输入数据 */
export interface UpdateStatInput extends Partial<CreateStatInput> {
  id: string;
}

/** 统计数据结果 */
export interface StatsDataResult {
  ok: boolean;
  error?: string;
  id?: string;
  name?: string;
  chartType?: string;
  data?: Array<{ name?: string; value?: number; date?: string }>;
}

/** 通用操作结果 */
export interface OperationResult {
  ok: boolean;
  error?: string;
}

/** 操作结果（带 ID） */
export interface IdResult extends OperationResult {
  id?: string;
}

/** 导入导出结果 */
export interface ExportResult extends OperationResult {
  filePath?: string;
}

/** 附件上传结果 */
export interface AttachmentUploadResult extends OperationResult {
  ids?: string[];
}

/** 演示数据操作结果 */
export interface DemoResult extends OperationResult {
  inserted?: number;
  deleted?: number;
}
