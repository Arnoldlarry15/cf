const Store = require('electron-store');

class StorageService {
  constructor() {
    this.store = new Store();
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  getSettings() {
    return this.get('settings') || {};
  }

  saveSettings(settings) {
    this.set('settings', settings);
  }

  getSnippets() {
    return this.get('snippets') || [];
  }

  saveSnippets(snippets) {
    this.set('snippets', snippets);
  }

  getMasterKnowledge() {
    return this.get('master_knowledge') || "No data yet. Take a screenshot snippet and configure an AI provider in Settings to begin organizing knowledge!";
  }

  saveMasterKnowledge(knowledge) {
    this.set('master_knowledge', knowledge);
  }
}

module.exports = { StorageService };
