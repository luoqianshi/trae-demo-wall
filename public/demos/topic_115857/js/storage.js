const Storage = {
  KEYS: {
    PROGRESS: 'manhua_drama_progress',
    NOTES: 'manhua_drama_notes',
    LLM_CONFIGS: 'manhua_drama_llm_configs',
    DEFAULT_CONFIG: 'manhua_drama_default_config',
    ONBOARDING_DONE: 'manhua_drama_onboarding_done',
    ACTIVE_PACK: 'manhua_drama_active_pack'
  },

  saveProgress(progressData) {
    try {
      localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progressData));
      return true;
    } catch (e) {
      console.error('保存进度失败:', e);
      return false;
    }
  },

  loadProgress() {
    try {
      const data = localStorage.getItem(this.KEYS.PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('读取进度失败:', e);
      return {};
    }
  },

  updateTaskProgress(taskId, completed) {
    const progress = this.loadProgress();
    progress[taskId] = !!completed;
    this.saveProgress(progress);
    return progress;
  },

  /**
   * 批量写入进度（合并）
   * @param {Record<string, boolean>} updates
   */
  mergeProgress(updates) {
    const progress = { ...this.loadProgress(), ...updates };
    this.saveProgress(progress);
    return progress;
  },

  isTaskCompleted(taskId) {
    const progress = this.loadProgress();
    return !!progress[taskId];
  },

  getPhaseProgress(phaseId) {
    const phase = WorkflowData.phases.find(p => p.id === phaseId);
    if (!phase) return { completed: 0, total: 0, percentage: 0, withNotes: 0 };

    const total = phase.tasks.length;
    let completed = 0;
    let withNotes = 0;
    phase.tasks.forEach(task => {
      if (this.isTaskCompleted(task.id)) completed++;
      if ((this.getNote(task.id) || '').trim()) withNotes++;
    });

    return {
      completed,
      total,
      withNotes,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  },

  getOverallProgress() {
    let total = 0;
    let completed = 0;
    let withNotes = 0;

    WorkflowData.phases.forEach(phase => {
      total += phase.tasks.length;
      phase.tasks.forEach(task => {
        if (this.isTaskCompleted(task.id)) completed++;
        if ((this.getNote(task.id) || '').trim()) withNotes++;
      });
    });

    return {
      completed,
      total,
      withNotes,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  },

  saveNote(taskId, note) {
    try {
      const notes = this.loadAllNotes();
      notes[taskId] = note;
      localStorage.setItem(this.KEYS.NOTES, JSON.stringify(notes));
      return true;
    } catch (e) {
      console.error('保存笔记失败:', e);
      return false;
    }
  },

  /**
   * 批量合并笔记
   * @param {Record<string, string>} noteMap
   * @param {{ overwrite?: boolean }} options
   */
  mergeNotes(noteMap, options = {}) {
    const overwrite = options.overwrite !== false;
    const notes = this.loadAllNotes();
    let filled = 0;
    let skipped = 0;

    Object.entries(noteMap || {}).forEach(([taskId, content]) => {
      if (content == null || String(content).trim() === '') return;
      const existing = (notes[taskId] || '').trim();
      if (existing && !overwrite) {
        skipped++;
        return;
      }
      notes[taskId] = String(content);
      filled++;
    });

    localStorage.setItem(this.KEYS.NOTES, JSON.stringify(notes));
    return { filled, skipped };
  },

  getNote(taskId) {
    const notes = this.loadAllNotes();
    return notes[taskId] || '';
  },

  hasNote(taskId) {
    return !!(this.getNote(taskId) || '').trim();
  },

  loadAllNotes() {
    try {
      const data = localStorage.getItem(this.KEYS.NOTES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('读取笔记失败:', e);
      return {};
    }
  },

  saveActivePackId(packId) {
    try {
      if (packId) localStorage.setItem(this.KEYS.ACTIVE_PACK, packId);
      else localStorage.removeItem(this.KEYS.ACTIVE_PACK);
      return true;
    } catch (e) {
      return false;
    }
  },

  getActivePackId() {
    return localStorage.getItem(this.KEYS.ACTIVE_PACK) || null;
  },

  saveLLMConfigs(configs) {
    try {
      localStorage.setItem(this.KEYS.LLM_CONFIGS, JSON.stringify(configs));
      return true;
    } catch (e) {
      console.error('保存配置失败:', e);
      return false;
    }
  },

  loadLLMConfigs() {
    try {
      const data = localStorage.getItem(this.KEYS.LLM_CONFIGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('读取配置失败:', e);
      return [];
    }
  },

  saveDefaultConfig(configId) {
    try {
      localStorage.setItem(this.KEYS.DEFAULT_CONFIG, configId);
      return true;
    } catch (e) {
      console.error('保存默认配置失败:', e);
      return false;
    }
  },

  getDefaultConfigId() {
    return localStorage.getItem(this.KEYS.DEFAULT_CONFIG) || null;
  },

  isOnboardingDone() {
    return localStorage.getItem(this.KEYS.ONBOARDING_DONE) === 'true';
  },

  setOnboardingDone() {
    localStorage.setItem(this.KEYS.ONBOARDING_DONE, 'true');
  },

  resetOnboarding() {
    localStorage.removeItem(this.KEYS.ONBOARDING_DONE);
  },

  exportAllData() {
    const data = {
      progress: this.loadProgress(),
      notes: this.loadAllNotes(),
      llmConfigs: this.loadLLMConfigs(),
      defaultConfig: this.getDefaultConfigId(),
      activePack: this.getActivePackId(),
      exportTime: new Date().toISOString(),
      version: '1.1'
    };
    return JSON.stringify(data, null, 2);
  },

  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (data.progress) {
        this.saveProgress(data.progress);
      }
      if (data.notes) {
        localStorage.setItem(this.KEYS.NOTES, JSON.stringify(data.notes));
      }
      if (data.llmConfigs) {
        this.saveLLMConfigs(data.llmConfigs);
      }
      if (data.defaultConfig) {
        this.saveDefaultConfig(data.defaultConfig);
      }
      if (data.activePack) {
        this.saveActivePackId(data.activePack);
      }

      return true;
    } catch (e) {
      console.error('导入数据失败:', e);
      return false;
    }
  },

  clearAllData() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  },

  clearProgress() {
    localStorage.removeItem(this.KEYS.PROGRESS);
    localStorage.removeItem(this.KEYS.NOTES);
    localStorage.removeItem(this.KEYS.ACTIVE_PACK);
    return true;
  }
};
