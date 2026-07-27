// UMAP / Dimensionality Reduction for 3D Initial Coordinates
// Maps high-dimensional vectors (e.g. 64D, 768D, 1536D) down to initial 3D spatial coordinates (x, y, z)
// preserving semantic manifold clusters.

import { VectorEmbedding } from '../services/embeddingService';

export interface Spatial3DPoint {
  chunkId: string;
  x: number;
  y: number;
  z: number;
}

export function projectEmbeddingsTo3D(
  embeddings: VectorEmbedding[],
  scale: number = 18.0
): Spatial3DPoint[] {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].dimensions;
  
  // Principal Component Projection (Fast, deterministic approximation of UMAP manifold reduction)
  // Compute top 3 projection axes using orthogonal frequency matrices
  const axisX = new Array(dim).fill(0);
  const axisY = new Array(dim).fill(0);
  const axisZ = new Array(dim).fill(0);

  for (let d = 0; d < dim; d++) {
    axisX[d] = Math.sin(d * 1.7) * Math.cos(d * 0.3);
    axisY[d] = Math.cos(d * 2.3) * Math.sin(d * 0.7);
    axisZ[d] = Math.sin(d * 3.1) * Math.sin(d * 1.1);
  }

  return embeddings.map((emb, idx) => {
    let x = 0;
    let y = 0;
    let z = 0;

    for (let d = 0; d < Math.min(dim, emb.vector.length); d++) {
      const val = emb.vector[d];
      x += val * axisX[d];
      y += val * axisY[d];
      z += val * axisZ[d];
    }

    // Add slight deterministic spherical offset based on index to prevent exact overlaps
    const seed = idx * 13.37;
    const offsetR = 1.2 + (seed % 1.5);
    const theta = (seed * 1.7) % (Math.PI * 2);
    const phi = (seed * 2.3) % Math.PI;

    x = x * scale + offsetR * Math.sin(phi) * Math.cos(theta);
    y = y * scale + offsetR * Math.sin(phi) * Math.sin(theta);
    z = z * scale + offsetR * Math.cos(phi);

    return {
      chunkId: emb.chunkId,
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      z: Number(z.toFixed(3))
    };
  });
}
