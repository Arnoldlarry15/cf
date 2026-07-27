// Embedding Generation Service for CaptureFlow
// Generates high-dimensional vector embeddings for text chunks using Google GenAI or local fallback.

import { TextChunk } from '../utils/textChunker';

export interface VectorEmbedding {
  chunkId: string;
  vector: number[];
  dimensions: number;
}

export async function generateChunkEmbeddings(
  chunks: TextChunk[],
  apiKey?: string
): Promise<VectorEmbedding[]> {
  if (chunks.length === 0) return [];

  // Try API route if available, otherwise use deterministic local vectorizer
  try {
    const res = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunks })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.embeddings && Array.isArray(data.embeddings)) {
        return data.embeddings;
      }
    }
  } catch (e) {
    console.warn('[EmbeddingService] Backend endpoint unavailable, running client-side embedding fallback.', e);
  }

  // Local fallback vectorizer (generates deterministic 64-dimensional semantic vectors)
  return chunks.map(chunk => generateLocalVector(chunk));
}

function generateLocalVector(chunk: TextChunk): VectorEmbedding {
  const dim = 64;
  const vector = new Array(dim).fill(0);
  const text = chunk.text.toLowerCase();

  // Keyword feature extraction to place semantically similar words in similar vector dimensions
  const categories = {
    design: ['ui', 'figma', 'color', 'palette', 'layout', 'css', 'card', 'style', 'draft'],
    dev: ['code', 'react', 'three', 'webgl', 'function', 'component', 'import', 'ts', 'api', 'state'],
    productivity: ['spec', 'task', 'backlog', 'notion', 'roadmap', 'doc', 'note', 'plan'],
    work: ['email', 'meeting', 'client', 'slack', 'sprint', 'report', 'presentation'],
    leisure: ['music', 'youtube', 'video', 'game', 'chat', 'article', 'feed']
  };

  Object.entries(categories).forEach(([cat, keywords], catIdx) => {
    keywords.forEach(kw => {
      if (text.includes(kw)) {
        const offset = catIdx * 12;
        vector[offset] += 1.5;
        vector[offset + 1] += 0.8;
      }
    });
  });

  // Hashing pseudo-random frequency filler for unmapped dimensions
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const idx = (charCode * (i + 1)) % dim;
    vector[idx] += (charCode % 10) / 100.0;
  }

  // L2 Normalize vector
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) vector[i] /= norm;

  return {
    chunkId: chunk.id,
    vector,
    dimensions: dim
  };
}
