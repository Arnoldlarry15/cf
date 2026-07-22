class SettingsService {
  constructor(storageService) {
    this.storage = storageService;
  }

  getSettings() {
    return this.storage.getSettings();
  }

  saveSettings(settings) {
    this.storage.saveSettings(settings);
  }
}

module.exports = { SettingsService };
