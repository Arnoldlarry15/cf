const { ipcMain } = require('electron');
const { validateSettings } = require('../shared/validation');

function registerSettingsIPC(settingsService, windowsManager) {
  ipcMain.handle('get-settings', () => {
    return settingsService.getSettings();
  });

  ipcMain.on('save-settings', (event, newSettings) => {
    try {
      validateSettings(newSettings);
    } catch (err) {
      console.error('IPC settings payload validation failed:', err.message);
      return;
    }
    settingsService.saveSettings(newSettings);
    windowsManager.notifyDashboard('settings-updated');
  });
}

module.exports = { registerSettingsIPC };
