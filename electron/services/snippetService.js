const Tesseract = require('tesseract.js');

class SnippetService {
  constructor(storageService) {
    this.storage = storageService;
  }

  async runOCR(dataUrl) {
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    const { data: { text } } = await Tesseract.recognize(
      buffer,
      'eng',
      { logger: m => console.log(m) }
    );
    return text;
  }

  getSnippets() {
    return this.storage.getSnippets();
  }

  deleteSnippet(id) {
    let snippets = this.getSnippets();
    snippets = snippets.filter(s => s.id !== id);
    this.storage.saveSnippets(snippets);
  }

  saveNewSnippet(snippet) {
    const snippets = this.getSnippets();
    snippets.unshift(snippet);
    this.storage.saveSnippets(snippets);
  }
}

module.exports = { SnippetService };
