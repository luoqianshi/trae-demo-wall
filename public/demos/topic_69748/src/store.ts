/**
 * Store 模块入口
 * 保持原有 API 兼容，同时从新模块导入
 */
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import type {
  Project, Progress, Attachment, FieldConfig, ProgressTemplate,
  KnowledgeCategory, KnowledgeItem, UiSettings, RegisteredStat, AiConfig, JumperConfig
} from './types';

// 重新导出类型
export type {
  Project, Progress, Attachment, FieldConfig, ProgressTemplate,
  KnowledgeCategory, KnowledgeItem, UiSettings, RegisteredStat, AiConfig, JumperConfig
} from './types';

// ==================== 项目 Store ====================
export const useProjectStore = create<{
  projects: Project[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: Partial<Project>) => Promise<string>;
  update: (data: Partial<Project>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleRecent: (id: string, isRecent: boolean) => Promise<void>;
}>((set, get) => ({
  projects: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const projects = await window.api.listProjects();
      set({ projects });
    } finally {
      set({ loading: false });
    }
  },
  add: async (data) => {
    const id = await window.api.addProject(data);
    const newProject = { ...data, id } as Project;
    set(state => ({ projects: [...state.projects, newProject] }));
    return id;
  },
  update: async (data) => {
    await window.api.updateProject(data);
    set(state => ({
      projects: state.projects.map(p =>
        (p.id === data.id ? { ...p, ...data } as Project : p)
      )
    }));
  },
  remove: async (id) => {
    await window.api.deleteProject(id);
    set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
  },
  toggleRecent: async (id, isRecent) => {
    const p = get().projects.find(x => x.id === id);
    if (!p) return;
    await window.api.updateProject({ ...p, isRecent });
    set(state => ({
      projects: state.projects.map(p => (p.id === id ? { ...p, isRecent } as Project : p))
    }));
  }
}));

export const useProjectCount = () =>
  useProjectStore((s) => s.projects.length);

export const useProjectsShallow = () =>
  useProjectStore((s) => s.projects, shallow);

export const useProjectById = (id: string | null | undefined) =>
  useProjectStore(
    (s) => (id ? s.projects.find((p) => p.id === id) || null : null),
    shallow
  );

// ==================== 进展 Store ====================
export const useProgressStore = create<{
  cache: Record<string, Progress[]>;
  load: (projectId: string) => Promise<Progress[]>;
  add: (data: any) => Promise<void>;
  update: (data: any) => Promise<void>;
  remove: (projectId: string, id: string) => Promise<void>;
}>((set, get) => ({
  cache: {},
  load: async (projectId) => {
    const rows = await window.api.listProgress(projectId);
    set(state => ({ cache: { ...state.cache, [projectId]: rows } }));
    return rows;
  },
  add: async (data) => {
    await window.api.addProgress(data);
    await get().load(data.projectId);
  },
  update: async (data) => {
    await window.api.updateProgress(data);
    await get().load(data.projectId);
  },
  remove: async (projectId, id) => {
    await window.api.deleteProgress(projectId, id);
    await get().load(projectId);
  }
}));

// ==================== 附件 Store ====================
export const useAttachmentStore = create<{
  cache: Record<string, Attachment[]>;
  load: (projectId: string) => Promise<Attachment[]>;
  upload: (projectId: string, filePaths: string[]) => Promise<void>;
  remove: (projectId: string, id: string) => Promise<void>;
}>((set, get) => ({
  cache: {},
  load: async (projectId) => {
    const rows = await window.api.listAttachments(projectId);
    set(state => ({ cache: { ...state.cache, [projectId]: rows } }));
    return rows;
  },
  upload: async (projectId, filePaths) => {
    await window.api.uploadAttachments(projectId, filePaths);
    await get().load(projectId);
  },
  remove: async (projectId, id) => {
    await window.api.deleteAttachment(projectId, id);
    await get().load(projectId);
  }
}));

// ==================== 字段配置 Store ====================
export const useFieldStore = create<{
  fields: FieldConfig[];
  load: () => Promise<void>;
  add: (data: any) => Promise<void>;
  update: (data: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
}>((set, get) => ({
  fields: [],
  load: async () => {
    const rows = await window.api.listFieldConfig();
    set({ fields: rows });
  },
  add: async (data) => {
    await window.api.addField(data);
    await get().load();
  },
  update: async (data) => {
    await window.api.updateField(data);
    set((state) => ({
      fields: state.fields.map((f) => (f.key === data.key ? { ...f, ...data } : f))
    }));
  },
  remove: async (key) => {
    await window.api.deleteField(key);
    set((state) => ({ fields: state.fields.filter((f) => f.key !== key) }));
  }
}));

// ==================== 模板 Store ====================
export const useTemplateStore = create<{
  templates: ProgressTemplate[];
  load: () => Promise<void>;
  add: (data: any) => Promise<void>;
  update: (data: any) => Promise<void>;
  remove: (id: string) => Promise<void>;
}>((set, get) => ({
  templates: [],
  load: async () => {
    const rows = await window.api.listTemplates();
    set({ templates: rows });
  },
  add: async (data) => {
    await window.api.addTemplate(data);
    await get().load();
  },
  update: async (data) => {
    await window.api.updateTemplate(data);
    await get().load();
  },
  remove: async (id) => {
    await window.api.deleteTemplate(id);
    await get().load();
  }
}));

// ==================== AI 配置 Store ====================
export const useAiStore = create<{
  config: AiConfig | null;
  load: () => Promise<void>;
  save: (data: any) => Promise<void>;
}>((set, get) => ({
  config: null,
  load: async () => {
    const c = await window.api.getAiConfig();
    set({ config: c });
  },
  save: async (data) => {
    await window.api.saveAiConfig(data);
    await get().load();
  }
}));

// ==================== 知识库 Store ====================
export const useKnowledgeStore = create<{
  categories: KnowledgeCategory[];
  items: KnowledgeItem[];
  loadCategories: () => Promise<void>;
  loadItems: (categoryId: string | null) => Promise<void>;
  search: (keyword: string, tag: string) => Promise<KnowledgeItem[]>;
  addCategory: (data: any) => Promise<void>;
  updateCategory: (data: any) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addItem: (data: any) => Promise<void>;
  updateItem: (data: any) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}>((set, get) => ({
  categories: [],
  items: [],
  loadCategories: async () => {
    const rows = await window.api.listCategories();
    set({ categories: rows });
  },
  loadItems: async (categoryId) => {
    const rows = await window.api.listKnowledge(categoryId);
    set({ items: rows });
  },
  search: async (keyword, tag) => {
    const rows = await window.api.searchKnowledge(keyword, tag);
    set({ items: rows });
    return rows;
  },
  addCategory: async (data) => {
    await window.api.addCategory(data);
    await get().loadCategories();
  },
  updateCategory: async (data) => {
    await window.api.updateCategory(data);
    await get().loadCategories();
  },
  removeCategory: async (id) => {
    await window.api.deleteCategory(id);
    await get().loadCategories();
  },
  addItem: async (data) => {
    await window.api.addKnowledge(data);
    await get().loadItems(data.categoryId || null);
  },
  updateItem: async (data) => {
    await window.api.updateKnowledge(data);
    await get().loadItems(data.categoryId || null);
  },
  removeItem: async (id) => {
    await window.api.deleteKnowledge(id);
  }
}));

// ==================== UI 设置 Store ====================
export const useUiStore = create<{
  defaultPage: string;
  theme: 'light' | 'dark' | 'industrial';
  tableDensity: 'small' | 'middle' | 'large';
  cardOpacity: number;
  auroraEnabled: boolean;
  cardOpacityAlpha: number;
  demoModeEnabled: boolean;
  load: () => Promise<void>;
  save: (data: Partial<UiSettings>) => Promise<void>;
}>((set, get) => ({
  defaultPage: 'quickAdd',
  theme: 'light',
  tableDensity: 'middle',
  cardOpacity: 0.72,
  auroraEnabled: true,
  cardOpacityAlpha: 0.82,
  demoModeEnabled: true,
  load: async () => {
    const r = await window.api.getUiSettings();
    if (r) {
      set({
        defaultPage: r.defaultPage || 'quickAdd',
        theme: (r.theme as any) || 'light',
        tableDensity: (r.tableDensity as any) || 'middle',
        cardOpacity: r.cardOpacity ?? 0.72,
        auroraEnabled: r.auroraEnabled !== false,
        cardOpacityAlpha: r.cardOpacityAlpha ?? 0.82,
        demoModeEnabled: r.demoModeEnabled !== false
      });
    }
  },
  save: async (data) => {
    const cur = get();
    const newData = {
      defaultPage: data.defaultPage !== undefined ? data.defaultPage : cur.defaultPage,
      theme: data.theme !== undefined ? data.theme : cur.theme,
      tableDensity: data.tableDensity !== undefined ? data.tableDensity : cur.tableDensity,
      cardOpacity: data.cardOpacity !== undefined ? data.cardOpacity : cur.cardOpacity,
      auroraEnabled: data.auroraEnabled !== undefined ? data.auroraEnabled : cur.auroraEnabled,
      cardOpacityAlpha: data.cardOpacityAlpha !== undefined ? data.cardOpacityAlpha : cur.cardOpacityAlpha,
      demoModeEnabled: data.demoModeEnabled !== undefined ? data.demoModeEnabled : cur.demoModeEnabled
    };
    await window.api.saveUiSettings(newData);
    set(newData);
  }
}));

// ==================== 跳转配置 Store ====================
export const useJumperStore = create<{
  personTemplate: string;
  groupTemplate: string;
  load: () => Promise<void>;
  save: (data: Partial<JumperConfig>) => Promise<void>;
}>((set, get) => ({
  personTemplate: '',
  groupTemplate: '',
  load: async () => {
    try {
      const r = await window.api.getJumperConfig();
      if (r) {
        set({
          personTemplate: r.personTemplate || '',
          groupTemplate: r.groupTemplate || ''
        });
      }
    } catch (_e) { /* ignore */ }
  },
  save: async (data) => {
    const cur = get();
    const newData = {
      personTemplate: data.personTemplate !== undefined ? data.personTemplate : cur.personTemplate,
      groupTemplate: data.groupTemplate !== undefined ? data.groupTemplate : cur.groupTemplate
    };
    await window.api.saveJumperConfig(newData);
    set(newData);
  }
}));

// ==================== 统计图 Store ====================
export const useStatsStore = create<{
  stats: RegisteredStat[];
  dataCache: Record<string, { name: string; chartType: string; data: any[] }>;
  load: () => Promise<void>;
  add: (data: any) => Promise<void>;
  update: (data: any) => Promise<void>;
  remove: (id: string) => Promise<void>;
  loadData: (id: string) => Promise<void>;
}>((set, get) => ({
  stats: [],
  dataCache: {},
  load: async () => {
    const rows = await window.api.listStats();
    set({ stats: rows });
  },
  add: async (data) => {
    await window.api.addStats(data);
    await get().load();
  },
  update: async (data) => {
    await window.api.updateStats(data);
    await get().load();
  },
  remove: async (id) => {
    await window.api.deleteStats(id);
    await get().load();
  },
  loadData: async (id) => {
    const r = await window.api.getStatsData(id);
    if (r && r.ok) {
      set(state => ({
        dataCache: {
          ...state.dataCache,
          [id]: { name: r.name || '', chartType: r.chartType || '', data: r.data || [] }
        }
      }));
    }
  }
}));
