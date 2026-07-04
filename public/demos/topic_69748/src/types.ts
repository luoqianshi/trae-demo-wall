/// <reference types="vite/client" />

declare global {
  interface Window {
    api: {
      getDataDir: () => Promise<string>;
      openPath: (p: string) => Promise<{ ok: boolean; error?: string }>;
      openExternal: (url: string) => Promise<{ ok: boolean; error?: string }>;
      showSaveDialog: (opts?: any) => Promise<any>;
      showOpenDialog: (opts?: any) => Promise<any>;

      listProjects: () => Promise<Project[]>;
      getProject: (id: string) => Promise<Project | null>;
      addProject: (data: any) => Promise<string>;
      updateProject: (data: any) => Promise<{ ok: boolean }>;
      deleteProject: (id: string) => Promise<{ ok: boolean }>;

      listProgress: (projectId: string) => Promise<Progress[]>;
      addProgress: (data: any) => Promise<string | null>;
      updateProgress: (data: any) => Promise<{ ok: boolean; error?: string }>;
      deleteProgress: (projectId: string, progressId: string) => Promise<{ ok: boolean; error?: string }>;

      listAttachments: (projectId: string) => Promise<Attachment[]>;
      uploadAttachments: (projectId: string, filePaths: string[], progressId?: string, progressDate?: string) => Promise<{ ok: boolean; ids: string[]; error?: string }>;
      deleteAttachment: (projectId: string, attachmentId: string) => Promise<{ ok: boolean; error?: string }>;

      listFieldConfig: () => Promise<FieldConfig[]>;
      addField: (data: any) => Promise<{ ok: boolean; error?: string }>;
      updateField: (data: any) => Promise<{ ok: boolean }>;
      deleteField: (key: string) => Promise<{ ok: boolean; error?: string }>;

      getAiConfig: () => Promise<AiConfig | null>;
      saveAiConfig: (data: any) => Promise<{ ok: boolean }>;
      runAiExtract: (chatText: string) => Promise<{ ok: boolean; error?: string; raw?: string; structured?: any; chatText?: string }>;

      listTemplates: () => Promise<ProgressTemplate[]>;
      addTemplate: (data: any) => Promise<string>;
      updateTemplate: (data: any) => Promise<{ ok: boolean }>;
      deleteTemplate: (id: string) => Promise<{ ok: boolean; error?: string }>;

      exportExcel: (filePath: string) => Promise<{ ok: boolean; filePath: string }>;
      importExcel: (filePath: string, mode: 'overwrite' | 'append') => Promise<{ ok: boolean }>;
      exportAttachments: (filePath: string) => Promise<{ ok: boolean; filePath: string }>;
      importAttachments: (filePath: string) => Promise<{ ok: boolean }>;

      listCategories: () => Promise<KnowledgeCategory[]>;
      addCategory: (data: any) => Promise<string>;
      updateCategory: (data: any) => Promise<{ ok: boolean }>;
      deleteCategory: (id: string) => Promise<{ ok: boolean }>;
      listKnowledge: (categoryId: string | null) => Promise<KnowledgeItem[]>;
      searchKnowledge: (keyword: string, tag: string) => Promise<KnowledgeItem[]>;
      addKnowledge: (data: any) => Promise<string>;
      updateKnowledge: (data: any) => Promise<{ ok: boolean }>;
      deleteKnowledge: (id: string) => Promise<{ ok: boolean }>;

      getUiSettings: () => Promise<UiSettings | null>;
      saveUiSettings: (data: any) => Promise<{ ok: boolean }>;

      getJumperConfig: () => Promise<JumperConfig>;
      saveJumperConfig: (data: Partial<JumperConfig>) => Promise<{ ok: boolean; error?: string }>;
      executeJump: (value: string, mode: 'person' | 'group') => Promise<{ ok: boolean; error?: string; command?: string }>;

      generateDemoProjects: (count?: number) => Promise<{ ok: boolean; inserted?: number; error?: string }>;
      clearDemoProjects: () => Promise<{ ok: boolean; deleted?: number; error?: string }>;

      listStats: () => Promise<RegisteredStat[]>;
      addStats: (data: any) => Promise<string>;
      updateStats: (data: any) => Promise<{ ok: boolean }>;
      deleteStats: (id: string) => Promise<{ ok: boolean; error?: string }>;
      getStatsData: (id: string) => Promise<{ ok: boolean; error?: string; name?: string; chartType?: string; data?: any[] }>;
    };
  }
}

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

export interface Progress {
  id: string;
  createdAt: string;
  content: string;
}

export interface Attachment {
  id: string;
  createdAt: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'jumper';
  visible: boolean;
  orderIndex: number;
  options: string[];
  defaultValue: string;
  showInQuickAdd: boolean;
  jumperMode: 'person' | 'group';
}

export interface AiConfig {
  id: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  promptTemplate: string;
}

export interface ProgressTemplate {
  id: string;
  name: string;
  fields: Array<{ key: string; label: string; type: string }>;
  createdAt: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  createdAt: string;
}

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

export interface UiSettings {
  id: string;
  defaultPage: string;
  theme: 'light' | 'dark' | 'industrial';
  tableDensity: 'small' | 'middle' | 'large';
  cardOpacity: number;
  auroraEnabled: boolean;
  cardOpacityAlpha: number;
  demoModeEnabled: boolean;
}

export interface JumperConfig {
  id: string;
  personTemplate: string;
  groupTemplate: string;
}

export interface RegisteredStat {
  id: string;
  name: string;
  chartType: string;
  dataSource: string;
  config: Record<string, any>;
  orderIndex: number;
  enabled: boolean;
}

export {};
