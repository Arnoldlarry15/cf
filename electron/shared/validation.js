function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings must be an object.');
  }
  if (settings.geminiKey && typeof settings.geminiKey !== 'string') {
    throw new Error('geminiKey must be a string.');
  }
  if (settings.openaiKey && typeof settings.openaiKey !== 'string') {
    throw new Error('openaiKey must be a string.');
  }
  return true;
}

function validateSnippetPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Snippet payload must be an object.');
  }
  const required = ['application', 'windowTitle', 'ocrText', 'summary', 'category', 'tags'];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null) {
      throw new Error(`Snippet payload is missing required field: ${field}`);
    }
  }
  if (typeof payload.application !== 'string') {
    throw new Error('application must be a string.');
  }
  if (typeof payload.windowTitle !== 'string') {
    throw new Error('windowTitle must be a string.');
  }
  if (typeof payload.ocrText !== 'string') {
    throw new Error('ocrText must be a string.');
  }
  if (!Array.isArray(payload.tags)) {
    throw new Error('tags must be an array.');
  }
  return true;
}

function validateChatPayload(messages) {
  if (!Array.isArray(messages)) {
    throw new Error('Chat payload must be an array of messages.');
  }
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      throw new Error(`Message at index ${i} must be an object.`);
    }
    if (!['user', 'model', 'assistant'].includes(msg.role)) {
      throw new Error(`Message at index ${i} has invalid role: ${msg.role}`);
    }
    if (typeof msg.text !== 'string') {
      throw new Error(`Message at index ${i} must have text content.`);
    }
  }
  return true;
}

module.exports = {
  validateSettings,
  validateSnippetPayload,
  validateChatPayload
};
