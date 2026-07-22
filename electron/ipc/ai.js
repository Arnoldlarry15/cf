const { ipcMain } = require('electron');
const { validateChatPayload } = require('../shared/validation');

function registerAIIPC(aiService) {
  ipcMain.handle('ai-chat', async (event, messages) => {
    try {
      validateChatPayload(messages);
    } catch (err) {
      console.error('IPC chat payload validation failed:', err.message);
      return {
        success: false,
        provider: 'none',
        code: 'VALIDATION_ERROR',
        message: err.message,
        text: `Validation Error: ${err.message}`,
        linkedMemories: []
      };
    }
    return await aiService.chat(messages);
  });
}

module.exports = { registerAIIPC };
