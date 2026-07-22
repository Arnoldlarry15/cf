class OpenAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async chat(systemInstruction, messages) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            ...messages.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.text
            }))
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenAI API returned an empty choices list.");
      }

      const text = data.choices[0].message.content;
      return this.parseResponse(text);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("OpenAI API request timed out after 15 seconds.");
      }
      throw error;
    }
  }

  async extract(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("OpenAI Extraction API returned an error status: " + response.status);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenAI Extraction API returned empty choices.");
      }
      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("OpenAI Extraction API request timed out after 15 seconds.");
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

module.exports = { OpenAIProvider };
