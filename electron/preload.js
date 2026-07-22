const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('captureflow', {
  version: '1.0',
  // Snipper
  onStartSnipping: (callback) => {
    const subscription = (event, dataUrl) => callback(dataUrl);
    ipcRenderer.on('start-snipping', subscription);
    return () => ipcRenderer.removeListener('start-snipping', subscription);
  },
  processSnippet: (data) => ipcRenderer.send('process-snippet', data),
  closeSnipper: () => ipcRenderer.send('close-snipper'),
  
  // Snippets / Memories Data
  snippets: {
    get: () => ipcRenderer.invoke('get-snippets'),
    getKnowledge: () => ipcRenderer.invoke('get-knowledge'),
    delete: (id) => ipcRenderer.send('delete-snippet', id),
    capture: (payload) => ipcRenderer.send('capture-snippet', payload),
    onUpdated: (callback) => {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on('snippets-updated', subscription);
      return () => ipcRenderer.removeListener('snippets-updated', subscription);
    }
  },

  // Settings
  settings: {
    get: () => ipcRenderer.invoke('get-settings'),
    save: (settings) => ipcRenderer.send('save-settings', settings),
    onUpdated: (callback) => {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on('settings-updated', subscription);
      return () => ipcRenderer.removeListener('settings-updated', subscription);
    }
  },

  // AI Cognitive Assistant
  ai: {
    chat: (messages) => ipcRenderer.invoke('ai-chat', messages)
  }
});
