const { SYSTEM_INSTRUCTION, EXTRACTION_PROMPT } = require('../../config/prompts');

class PromptBuilder {
  constructor(contextAssembler) {
    this.contextAssembler = contextAssembler;
  }

  buildChatPrompt(snippets) {
    const snippetsContext = this.contextAssembler.assembleSnippets(snippets);
    return SYSTEM_INSTRUCTION.replace('{{snippetsContext}}', snippetsContext);
  }

  buildExtractionPrompt(currentKnowledge, newText) {
    return EXTRACTION_PROMPT
      .replace('{{currentKnowledge}}', currentKnowledge)
      .replace('{{newText}}', newText);
  }
}

module.exports = { PromptBuilder };
