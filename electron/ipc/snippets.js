const { ipcMain, Notification } = require('electron');

function registerSnippetsIPC(snippetService, aiService, windowsManager) {
  ipcMain.on('close-snipper', () => {
    windowsManager.closeSnipper();
  });

  ipcMain.on('process-snippet', async (event, { dataUrl, rect }) => {
    windowsManager.closeSnipper();

    try {
      // 1. Run OCR
      const text = await snippetService.runOCR(dataUrl);

      // 2. Query LLM to integrate knowledge
      const currentKnowledge = snippetService.storage.getMasterKnowledge();
      const newKnowledge = await aiService.runIntelligenceExtraction(currentKnowledge, text);

      // 3. Map to Memory schema
      const newSnippet = {
        id: `mem-${Date.now()}`,
        imageUrl: 'terminal_output',
        application: 'Snippet Extractor',
        windowTitle: 'Captured Snippet',
        timestamp: new Date().toISOString(),
        category: 'Productivity',
        confidence: 0.95,
        ocrText: text,
        summary: newKnowledge.startsWith("Error") ? text.substring(0, 100) : newKnowledge,
        tags: ['captured', 'ocr'],
        relationships: [],
        history: [
          { timestamp: new Date().toISOString(), action: "capture", details: "Captured via global hotkey overlay." },
          { timestamp: new Date().toISOString(), action: "ai_analyze", details: "OCR and AI indexing complete." }
        ]
      };

      // Calculate semantic links
      const snippets = snippetService.getSnippets();
      snippets.forEach(existing => {
        if (existing.tags) {
          const intersection = existing.tags.filter(t => newSnippet.tags.includes(t));
          if (intersection.length > 0) {
            const weight = Math.min(0.3 + intersection.length * 0.15, 0.95);
            newSnippet.relationships.push({ targetId: existing.id, type: "semantic", weight });
            if (!existing.relationships) existing.relationships = [];
            existing.relationships.push({ targetId: newSnippet.id, type: "semantic", weight });
          }
        }
      });

      // Save snippet
      snippetService.saveNewSnippet(newSnippet);

      // Save knowledge base
      if (newKnowledge && !newKnowledge.startsWith("Error")) {
        try {
          const match = newKnowledge.match(/\{[\s\S]*\}/);
          if (match) {
            JSON.parse(match[0]);
            snippetService.storage.saveMasterKnowledge(match[0]);
          }
        } catch (e) {
          console.error("Invalid JSON formatted knowledge base", e);
        }
      }

      // Notifications
      if (newKnowledge && newKnowledge.startsWith("Error")) {
        new Notification({
          title: 'CaptureFlow AI Error',
          body: newKnowledge
        }).show();
      } else {
        new Notification({
          title: 'Snippet Processed',
          body: 'Extracted text and updated knowledge base.'
        }).show();
      }

      // Notify frontend
      windowsManager.notifyDashboard('snippets-updated');

    } catch (err) {
      console.error('Error extracting snippet data:', err);
    }
  });

  ipcMain.handle('get-snippets', () => snippetService.getSnippets());
  ipcMain.handle('get-knowledge', () => snippetService.storage.getMasterKnowledge());

  ipcMain.on('delete-snippet', (event, id) => {
    snippetService.deleteSnippet(id);
    windowsManager.notifyDashboard('snippets-updated');
  });

  ipcMain.on('capture-snippet', (event, payload) => {
    const newSnippet = {
      id: payload.id || `mem-${Date.now()}`,
      imageUrl: payload.imageUrl || payload.application.toLowerCase().replace(/[^a-z]/g, '_') || 'chrome_search',
      application: payload.application,
      windowTitle: payload.windowTitle,
      timestamp: payload.timestamp || new Date().toISOString(),
      category: payload.category || 'Productivity',
      confidence: payload.confidence || 0.95,
      ocrText: payload.ocrText,
      summary: payload.summary || payload.ocrText.substring(0, 100),
      tags: payload.tags || ['captured'],
      relationships: [],
      history: payload.history || [
        { timestamp: new Date().toISOString(), action: "capture", details: "Manual capture simulated." }
      ]
    };

    const snippets = snippetService.getSnippets();
    snippets.forEach(existing => {
      if (existing.tags) {
        const intersection = existing.tags.filter(t => newSnippet.tags.includes(t));
        if (intersection.length > 0) {
          const weight = Math.min(0.3 + intersection.length * 0.15, 0.95);
          newSnippet.relationships.push({ targetId: existing.id, type: "semantic", weight });
          if (!existing.relationships) existing.relationships = [];
          existing.relationships.push({ targetId: newSnippet.id, type: "semantic", weight });
        }
      }
    });

    snippetService.saveNewSnippet(newSnippet);
    windowsManager.notifyDashboard('snippets-updated');
  });
}

module.exports = { registerSnippetsIPC };
