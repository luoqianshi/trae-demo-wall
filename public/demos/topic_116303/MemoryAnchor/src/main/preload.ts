// Preload Script
// Exposes protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  IPC_EVENT_CHANNELS,
  ElectronAPI,
} from '../shared/types/ipc';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
// The `as ElectronAPI` cast below is load-bearing: it provides contextual
// typing for every method's parameters (removing it makes all params implicitly `any`).
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- cast drives contextual typing of method params; removal produces TS7006 implicit-any errors
contextBridge.exposeInMainWorld('electronAPI', {
  // Host platform ('darwin' | 'win32' | 'linux') — used for macOS titlebar layout.
  platform: process.platform,

  // Collection APIs
  collection: {
    create: (request) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_CREATE, request),
    get: (id) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_GET, id),
    list: (params) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_LIST, params),
    update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_UPDATE, id, data),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_DELETE, id),
    restore: (id) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_RESTORE, id),
    deletePermanently: (id) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_DELETE_PERMANENTLY, id),
    toggleFavorite: (id) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_TOGGLE_FAVORITE, id),
    markAsRead: (id) => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_MARK_AS_READ, id),
    stats: () => ipcRenderer.invoke(IPC_CHANNELS.COLLECTION_STATS),
  },

  // Search APIs
  search: {
    search: (query) => ipcRenderer.invoke(IPC_CHANNELS.SEARCH_SEARCH, query),
    suggestTags: (query, limit) => ipcRenderer.invoke(IPC_CHANNELS.SEARCH_SUGGEST_TAGS, query, limit),
  },

  // Scraper APIs
  scraper: {
    scrape: (url, options) => ipcRenderer.invoke(IPC_CHANNELS.SCRAPER_SCRAPE, url, options),
    scrapeBatch: (urls) => ipcRenderer.invoke(IPC_CHANNELS.SCRAPER_SCRAPE_BATCH, urls),
    getStatus: (taskId) => ipcRenderer.invoke(IPC_CHANNELS.SCRAPER_GET_STATUS, taskId),
  },

  // AI APIs
  ai: {
    generateSummary: (content) => ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_SUMMARY, content),
    generateTags: (content) => ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_TAGS, content),
    generateKeyPoints: (content) => ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_KEY_POINTS, content),
    generateEmbedding: (text) => ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_EMBEDDING, text),
    testConnection: (providerId, modelType) => ipcRenderer.invoke(IPC_CHANNELS.AI_TEST_CONNECTION, providerId, modelType),
    reprocess: (collectionId) => ipcRenderer.invoke(IPC_CHANNELS.AI_REPROCESS, collectionId),
    reindexAll: () => ipcRenderer.invoke(IPC_CHANNELS.AI_REINDEX_ALL),
  },

  // Version APIs
  version: {
    list: (collectionId, page, pageSize) =>
      ipcRenderer.invoke(IPC_CHANNELS.VERSION_LIST, collectionId, page, pageSize),
    compare: (collectionId, versionAId, versionBId) =>
      ipcRenderer.invoke(IPC_CHANNELS.VERSION_COMPARE, collectionId, versionAId, versionBId),
    checkUpdate: (collectionId) => ipcRenderer.invoke(IPC_CHANNELS.VERSION_CHECK_UPDATE, collectionId),
    restore: (collectionId, versionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.VERSION_RESTORE, collectionId, versionId),
  },

  // Config APIs
  config: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
    update: (partial) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE, partial),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_RESET),
  },

  // Export APIs
  export: {
    json: (collectionIds, options) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_JSON, collectionIds, options),
    markdown: (collectionIds, options) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_MARKDOWN, collectionIds, options),
    html: (collectionIds, options) =>
      ipcRenderer.invoke(IPC_CHANNELS.EXPORT_HTML, collectionIds, options),
  },

  // Import APIs
  import: {
    json: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.IMPORT_JSON, filePath),
  },

  // Backup APIs
  backup: {
    create: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE),
    restore: (source) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, source),
  },

  // Window APIs
  window: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    unmaximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_UNMAXIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    toggleMaximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE),
    toggleFullScreen: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_FULL_SCREEN),
    isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
    isFullScreen: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_FULL_SCREEN),
    reload: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_RELOAD),
  },

  // Update APIs
  update: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK),
    download: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DOWNLOAD),
    install: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_INSTALL),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_GET_STATUS),
    getProgress: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_GET_PROGRESS),
  },

  // App APIs
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    getPath: (name) => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PATH, name),
    quit: () => ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
  },

  // Event listeners - with whitelist validation
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels: readonly string[] = Object.values(IPC_EVENT_CHANNELS);
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args: unknown[]) => callback(...args));
    }
  },

  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Shortcut event listeners
  onShortcut: (action, callback) => {
    const validActions = [
      'newCollection',
      'search',
      'allCollections',
      'settings',
      'quickScrape',
    ];
    const channel = `shortcut:${action}`;
    if (validActions.includes(action)) {
      ipcRenderer.on(channel, callback);
    }
  },

  // Tray event listeners
  onTray: (action, callback) => {
    const validActions = [
      'newCollection',
      'allCollections',
      'search',
      'settings',
    ];
    const channel = `tray:${action}`;
    if (validActions.includes(action)) {
      ipcRenderer.on(channel, callback);
    }
  },

  // Dock event listeners (macOS only)
  onDock: (action, callback) => {
    const validActions = [
      'newCollection',
      'allCollections',
      'settings',
    ];
    const channel = `dock:${action}`;
    if (validActions.includes(action)) {
      ipcRenderer.on(channel, callback);
    }
  },
} as ElectronAPI);