const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopPet', {
  getWindowPosition: () => ipcRenderer.invoke('window:get-position'),
  setWindowPosition: (x, y) => ipcRenderer.send('window:set-position', [x, y]),
  close: () => ipcRenderer.send('window:close'),
  showContextMenu: () => ipcRenderer.send('menu:show-context-menu'),
  choosePetSource: () => ipcRenderer.invoke('pet:choose-source'),
  startPetGeneration: (payload) => ipcRenderer.invoke('pet:start-generation', payload),
  importGlbModel: () => ipcRenderer.invoke('pet:import-glb-model'),
  getCurrentGeneratedPet: () => ipcRenderer.invoke('pet:get-current-generated-pet'),
  onPetAction: (callback) => ipcRenderer.on('pet:action', (_event, action) => callback(action)),
  onSizeChanged: (callback) => ipcRenderer.on('pet:size-changed', (_event, size) => callback(size)),
  onGenerationProgress: (callback) => ipcRenderer.on('pet:generation-progress', (_event, progress) => callback(progress))
});
