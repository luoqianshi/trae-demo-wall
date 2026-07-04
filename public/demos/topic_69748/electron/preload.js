const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('show-open-dialog', opts),

  listProjects: () => ipcRenderer.invoke('list-projects'),
  getProject: (id) => ipcRenderer.invoke('get-project', id),
  addProject: (data) => ipcRenderer.invoke('add-project', data),
  updateProject: (data) => ipcRenderer.invoke('update-project', data),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),

  listProgress: (projectId) => ipcRenderer.invoke('list-progress', projectId),
  addProgress: (data) => ipcRenderer.invoke('add-progress', data),
  updateProgress: (data) => ipcRenderer.invoke('update-progress', data),
  deleteProgress: (projectId, progressId) => ipcRenderer.invoke('delete-progress', projectId, progressId),

  listAttachments: (projectId) => ipcRenderer.invoke('list-attachments', projectId),
  uploadAttachments: (projectId, filePaths, progressId, progressDate) => ipcRenderer.invoke('upload-attachments', projectId, filePaths, progressId, progressDate),
  deleteAttachment: (projectId, attachmentId) => ipcRenderer.invoke('delete-attachment', projectId, attachmentId),

  listFieldConfig: () => ipcRenderer.invoke('list-field-config'),
  addField: (data) => ipcRenderer.invoke('add-field', data),
  updateField: (data) => ipcRenderer.invoke('update-field', data),
  deleteField: (key) => ipcRenderer.invoke('delete-field', key),

  getAiConfig: () => ipcRenderer.invoke('get-ai-config'),
  saveAiConfig: (data) => ipcRenderer.invoke('save-ai-config', data),
  runAiExtract: (chatText) => ipcRenderer.invoke('run-ai-extract', chatText),

  listTemplates: () => ipcRenderer.invoke('list-templates'),
  addTemplate: (data) => ipcRenderer.invoke('add-template', data),
  updateTemplate: (data) => ipcRenderer.invoke('update-template', data),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),

  exportExcel: (filePath, projectList) => ipcRenderer.invoke('export-excel', filePath, projectList),
  importExcel: (filePath, mode) => ipcRenderer.invoke('import-excel', filePath, mode),
  exportAttachments: (filePath) => ipcRenderer.invoke('export-attachments', filePath),
  importAttachments: (filePath) => ipcRenderer.invoke('import-attachments', filePath),

  listCategories: () => ipcRenderer.invoke('list-categories'),
  addCategory: (data) => ipcRenderer.invoke('add-category', data),
  updateCategory: (data) => ipcRenderer.invoke('update-category', data),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),
  listKnowledge: (categoryId) => ipcRenderer.invoke('list-knowledge', categoryId),
  searchKnowledge: (keyword, tag) => ipcRenderer.invoke('search-knowledge', keyword, tag),
  addKnowledge: (data) => ipcRenderer.invoke('add-knowledge', data),
  updateKnowledge: (data) => ipcRenderer.invoke('update-knowledge', data),
  deleteKnowledge: (id) => ipcRenderer.invoke('delete-knowledge', id),

  getUiSettings: () => ipcRenderer.invoke('get-ui-settings'),
  saveUiSettings: (data) => ipcRenderer.invoke('save-ui-settings', data),

  getJumperConfig: () => ipcRenderer.invoke('get-jumper-config'),
  saveJumperConfig: (data) => ipcRenderer.invoke('save-jumper-config', data),
  executeJump: (value, mode) => ipcRenderer.invoke('execute-jump', value, mode),

  generateDemoProjects: (count) => ipcRenderer.invoke('generate-demo-projects', count),
  clearDemoProjects: () => ipcRenderer.invoke('clear-demo-projects'),

  listStats: () => ipcRenderer.invoke('list-stats'),
  addStats: (data) => ipcRenderer.invoke('add-stats', data),
  updateStats: (data) => ipcRenderer.invoke('update-stats', data),
  deleteStats: (id) => ipcRenderer.invoke('delete-stats', id),
  getStatsData: (id) => ipcRenderer.invoke('get-stats-data', id)
});
