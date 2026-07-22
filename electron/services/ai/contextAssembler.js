class ContextAssembler {
  assembleSnippets(snippets) {
    return snippets.map(s => {
      return `[ID: ${s.id}]
Time: ${new Date(s.timestamp).toISOString()}
Text:
"""
${s.text}
"""
--------------------------------------------------`;
    }).join('\n');
  }
}

module.exports = { ContextAssembler };
