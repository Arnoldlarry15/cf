const { autoUpdater } = require('electron-updater');
const { app } = require('electron');

class UpdaterService {
  init() {
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    autoUpdater.on('update-downloaded', () => {
      autoUpdater.quitAndInstall();
    });
  }
}

module.exports = { UpdaterService };
