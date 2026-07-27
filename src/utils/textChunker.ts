// Text Chunking Utility for CaptureFlow Ingestion Pipeline
// Performs recursive text splitting into 300–500 token chunks with 10% overlap.

export interface TextChunk {
  id: string;
  text: string;
  chunkIndex: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
}

export function recursiveChunkText(
  text: string,
  targetChunkSize: number = 400, // ~400 tokens / ~1600 characters
  overlapRatio: number = 0.10     // 10% overlap
): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  // Approximate 1 token = 4 characters
  const chunkSizeChars = targetChunkSize * 4;
  const overlapChars = Math.floor(chunkSizeChars * overlapRatio);
  const stepSize = chunkSizeChars - overlapChars;

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  // Split by natural paragraph or line breaks if available
  const paragraphs = text.split(/\n\s*\n/);
  
  if (paragraphs.length > 1 && text.length > chunkSizeChars) {
    let currentChunk = "";
    let currentStart = 0;

    for (let p of paragraphs) {
      if (currentChunk.length + p.length <= chunkSizeChars) {
        if (currentChunk.length === 0) currentStart = text.indexOf(p);
        currentChunk += (currentChunk ? "\n\n" : "") + p;
      } else {
        if (currentChunk) {
          chunks.push({
            id: `chunk-${chunkIndex}`,
            text: currentChunk.trim(),
            chunkIndex,
            totalChunks: 0,
            startChar: currentStart,
            endChar: currentStart + currentChunk.length
          });
          chunkIndex++;
        }
        currentChunk = p;
        currentStart = text.indexOf(p);
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        chunkIndex,
        totalChunks: 0,
        startChar: currentStart,
        endChar: currentStart + currentChunk.length
      });
    }
  } else {
    // Fallback slide-window chunking
    while (start < text.length) {
      const end = Math.min(start + chunkSizeChars, text.length);
      const chunkText = text.slice(start, end).trim();

      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: chunkText,
        chunkIndex,
        totalChunks: 0,
        startChar: start,
        endChar: end
      });

      chunkIndex++;
      if (end >= text.length) break;
      start += stepSize;
    }
  }

  // Update totalChunks count
  const total = chunks.length;
  chunks.forEach(c => {
    c.totalChunks = total;
  });

  return chunks;
}
