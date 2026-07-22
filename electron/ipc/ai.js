const { ipcMain } = require('electron');

function registerAIIPC(aiService) {
  ipcMain.handle('ai-chat', async (event, messages) => {
    return await aiService.chat(messages);
  });
}

module.exports = { registerAIIPC };
