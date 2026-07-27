const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

class SnippetService {
  constructor(storageService) {
    this.storage = storageService;
  }

  async runOCR(dataUrl) {
    try {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
        return "";
      }
      const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
      
      const appRoot = path.join(__dirname, '../../');
      const localTrainedData = path.join(appRoot, 'eng.traineddata');
      
      const options = { logger: m => console.log(m) };
      if (fs.existsSync(localTrainedData)) {
        options.langPath = appRoot;
      }

      const { data: { text } } = await Tesseract.recognize(buffer, 'eng', options);
      return text || "";
    } catch (err) {
      console.error('OCR processing failed:', err);
      return "";
    }
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
