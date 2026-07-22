const { ipcMain } = require('electron');

function registerSettingsIPC(settingsService, windowsManager) {
  ipcMain.handle('get-settings', () => {
    return settingsService.getSettings();
  });

  ipcMain.on('save-settings', (event, newSettings) => {
    settingsService.saveSettings(newSettings);
    windowsManager.notifyDashboard('settings-updated');
  });
}

module.exports = { registerSettingsIPC };
