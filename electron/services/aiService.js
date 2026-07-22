const { ContextAssembler } = require('./ai/contextAssembler');
const { PromptBuilder } = require('./ai/promptBuilder');
const { GeminiProvider } = require('./ai/providers/gemini');
const { OpenAIProvider } = require('./ai/providers/openai');
const { OfflineProvider } = require('./ai/providers/offlineProvider');
const { logger } = require('../utils/logger');

class AIService {
  constructor(storageService) {
    this.storage = storageService;
    this.contextAssembler = new ContextAssembler();
    this.promptBuilder = new PromptBuilder(this.contextAssembler);
  }

  getProvider() {
    const settings = this.storage.getSettings();
    let apiKey = settings.geminiKey || process.env.GEMINI_API_KEY;
    
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      return new GeminiProvider(apiKey);
    }
    if (settings.openaiKey) {
      return new OpenAIProvider(settings.openaiKey);
    }
    return new OfflineProvider();
  }

  async chat(messages) {
    const snippets = this.storage.getSnippets();
    const systemInstruction = this.promptBuilder.buildChatPrompt(snippets);
    const provider = this.getProvider();
    const providerName = provider.constructor.name.replace('Provider', '').toLowerCase();

    logger.info("AI Chat request started", { provider: providerName, messageCount: messages.length });
    const startTime = Date.now();

    try {
      let result;
      if (provider instanceof OfflineProvider) {
        result = await provider.chat(systemInstruction, messages, snippets);
      } else {
        result = await provider.chat(systemInstruction, messages);
      }
      
      const duration = Date.now() - startTime;
      logger.info("AI Chat request succeeded", { provider: providerName, durationMs: duration, linkedCount: result.linkedMemories.length });

      return {
        success: true,
        provider: providerName,
        text: result.text,
        linkedMemories: result.linkedMemories
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorCode = error.message.includes("timed out") ? "TIMEOUT" : "API_ERROR";
      logger.error("AI Chat request failed", error, { provider: providerName, durationMs: duration, code: errorCode });

      return {
        success: false,
        provider: providerName,
        code: errorCode,
        message: error.message,
        text: `Error: The AI sync failed. ${error.message}`,
        linkedMemories: []
      };
    }
  }

  async runIntelligenceExtraction(currentKnowledge, newText) {
    const provider = this.getProvider();
    const providerName = provider.constructor.name.replace('Provider', '').toLowerCase();
    
    logger.info("AI Extraction request started", { provider: providerName });
    const startTime = Date.now();

    try {
      const prompt = this.promptBuilder.buildExtractionPrompt(currentKnowledge, newText);
      const result = await provider.extract(prompt);
      
      const duration = Date.now() - startTime;
      logger.info("AI Extraction request succeeded", { provider: providerName, durationMs: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("AI Extraction request failed", error, { provider: providerName, durationMs: duration });
      return `Error: Extraction failed. ${error.message}`;
    }
  }
}

module.exports = { AIService };
