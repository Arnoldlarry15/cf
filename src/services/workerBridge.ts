// Worker Payload Bridge for CaptureFlow
// Formats chunk metadata, vector IDs, and initial 3D positions into Float32Array buffers for layoutWorker.ts.

import { Spatial3DPoint } from '../utils/umapProjection';
import { EdgeData } from '../workers/layoutWorker';

export interface LayoutPayload {
  positions: Float32Array;
  anchors: Float32Array;
  edges: EdgeData[];
  count: number;
}

export function prepareWorkerPayload(
  points: Spatial3DPoint[],
  relationships: Array<{ sourceIndex: number; targetIndex: number; weight: number }> = []
): LayoutPayload {
  const count = points.length;
  const positions = new Float32Array(count * 3);
  const anchors = new Float32Array(count * 3);

  points.forEach((pt, idx) => {
    const idx3 = idx * 3;
    positions[idx3] = pt.x;
    positions[idx3 + 1] = pt.y;
    positions[idx3 + 2] = pt.z;

    // Anchor defaults to initial UMAP coordinate center
    anchors[idx3] = pt.x;
    anchors[idx3 + 1] = pt.y;
    anchors[idx3 + 2] = pt.z;
  });

  const edges: EdgeData[] = relationships.map(r => ({
    source: r.sourceIndex,
    target: r.targetIndex,
    weight: r.weight
  }));

  return {
    positions,
    anchors,
    edges,
    count
  };
}
