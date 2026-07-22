class OfflineProvider {
  async chat(systemInstruction, messages, snippets) {
    const lastUserMessage = messages[messages.length - 1]?.text || "";
    const queryLower = lastUserMessage.toLowerCase();
    const matched = snippets.filter(s => s.text.toLowerCase().includes(queryLower));

    let responseText = `I am currently operating in **Local Offline Mode** (no Gemini/OpenAI API keys configured). I've run a keyword matching algorithm on your OCR logs:\n\n`;
    if (matched.length > 0) {
      responseText += `I found **${matched.length} relevant memories** matching your query:\n\n`;
      matched.forEach(s => {
        responseText += `- Captured snippet at *${new Date(s.timestamp).toLocaleTimeString()}*:\n  *${s.text.substring(0, 100)}...*\n\n`;
      });
      responseText += `\n[RELEVANT_MEMORIES: ${matched.map(s => s.id).join(', ')}]`;
    } else {
      responseText += `I couldn't find any direct matches in your OCR text logs for "${lastUserMessage}". Please configure an API key in Settings to use the full AI chat.`;
    }

    return { text: responseText, linkedMemories: matched.map(s => s.id) };
  }

  async extract(prompt) {
    return "Error: Offline data extraction is not supported without a configured AI provider key.";
  }
}

module.exports = { OfflineProvider };
