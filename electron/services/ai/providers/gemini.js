class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async chat(systemInstruction, messages) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }))
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("Gemini API returned an empty response candidate list.");
      }

      const text = data.candidates[0].content.parts[0].text;
      return this.parseResponse(text);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("Gemini API request timed out after 15 seconds.");
      }
      throw error;
    }
  }

  async extract(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini Extraction API returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("Gemini Extraction API returned empty candidates.");
      }
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("Gemini Extraction API request timed out after 15 seconds.");
      }
      throw error;
    }
  }

  parseResponse(text) {
    const regex = /\[RELEVANT_MEMORIES:\s*([^\]]+)\]/i;
    const match = text.match(regex);
    let linkedMemories = [];
    if (match && match[1]) {
      linkedMemories = match[1].split(',').map(s => s.trim());
    }
    return { text, linkedMemories };
  }
}

module.exports = { GeminiProvider };
