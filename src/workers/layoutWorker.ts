// Web Worker for 3D Force-Directed Layout Calculation
// Runs O(N^2) or O(N log N) physics simulations off the main thread.
// Communicates via zero-copy Float32Array ArrayBuffer transfers.

export interface EdgeData {
  source: number;
  target: number;
  weight: number;
}

export interface WorkerInitPayload {
  positions: Float32Array; // N * 3
  anchors: Float32Array;   // N * 3 (cluster anchor offsets or target centers)
  edges: EdgeData[];
  config?: {
    repulsion?: number;
    attraction?: number;
    damping?: number;
    gravity?: number;
  };
}

let positions: Float32Array | null = null;
let velocities: Float32Array | null = null;
let anchors: Float32Array | null = null;
let edges: EdgeData[] = [];
let count = 0;
let isRunning = false;

// Physics parameters
let repulsionStrength = 20.0;
let attractionStrength = 0.08;
let damping = 0.85;
let gravityStrength = 0.02;

self.onmessage = (event: MessageEvent) => {
  if (!event || !event.data) return;

  const type = event.data.type;
  const payload = event.data.payload || event.data;

  if (type === 'INIT') {
    if (!payload || !payload.positions) {
      console.warn("layoutWorker: Received INIT event without positions payload", event.data);
      return;
    }
    const initData = payload as WorkerInitPayload;
    positions = new Float32Array(initData.positions); // Copy buffer
    count = positions.length / 3;
    velocities = new Float32Array(count * 3);
    anchors = initData.anchors ? new Float32Array(initData.anchors) : null;
    edges = Array.isArray(initData.edges) ? initData.edges : [];

    if (initData.config) {
      if (initData.config.repulsion !== undefined) repulsionStrength = initData.config.repulsion;
      if (initData.config.attraction !== undefined) attractionStrength = initData.config.attraction;
      if (initData.config.damping !== undefined) damping = initData.config.damping;
      if (initData.config.gravity !== undefined) gravityStrength = initData.config.gravity;
    }

    isRunning = true;
    runSimulationStep();
  } else if (type === 'UPDATE_POSITIONS') {
    const rawPositions = payload ? (payload.positions || event.data.positions) : event.data.positions;
    if (rawPositions) {
      positions = new Float32Array(rawPositions);
      if (isRunning) {
        runSimulationStep();
      }
    }
  } else if (type === 'STOP') {
    isRunning = false;
  }
};

function runSimulationStep() {
  if (!positions || !velocities || !isRunning) return;

  const n = count;
  const pos = positions;
  const vel = velocities;

  // Step 1: Repulsion between nodes (N^2 optimized typed array loop)
  for (let i = 0; i < n; i++) {
    const i3 = i * 3;
    const px = pos[i3];
    const py = pos[i3 + 1];
    const pz = pos[i3 + 2];

    for (let j = i + 1; j < n; j++) {
      const j3 = j * 3;
      const dx = px - pos[j3];
      const dy = py - pos[j3 + 1];
      const dz = pz - pos[j3 + 2];

      const distSq = dx * dx + dy * dy + dz * dz + 0.1; // Softener to prevent division by zero
      if (distSq < 400.0) { // Cutoff distance
        const dist = Math.sqrt(distSq);
        const force = repulsionStrength / (distSq * dist);
        const fx = dx * force;
        const fy = dy * force;
        const fz = dz * force;

        vel[i3] += fx;
        vel[i3 + 1] += fy;
        vel[i3 + 2] += fz;

        vel[j3] -= fx;
        vel[j3 + 1] -= fy;
        vel[j3 + 2] -= fz;
      }
    }
  }

  // Step 2: Attraction along edges
  for (let e = 0; e < edges.length; e++) {
    const { source: i, target: j, weight } = edges[e];
    if (i >= n || j >= n) continue;

    const i3 = i * 3;
    const j3 = j * 3;

    const dx = pos[j3] - pos[i3];
    const dy = pos[j3 + 1] - pos[i3 + 1];
    const dz = pos[j3 + 2] - pos[i3 + 2];

    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
    const idealDist = 4.0 / Math.max(0.2, weight);
    const delta = dist - idealDist;
    const force = delta * attractionStrength * weight;

    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    const fz = (dz / dist) * force;

    vel[i3] += fx;
    vel[i3 + 1] += fy;
    vel[i3 + 2] += fz;

    vel[j3] -= fx;
    vel[j3 + 1] -= fy;
    vel[j3 + 2] -= fz;
  }

  // Step 3: Cluster Anchor Gravity / Center Gravity
  for (let i = 0; i < n; i++) {
    const i3 = i * 3;
    const targetX = anchors ? anchors[i3] : 0;
    const targetY = anchors ? anchors[i3 + 1] : 0;
    const targetZ = anchors ? anchors[i3 + 2] : 0;

    const dx = targetX - pos[i3];
    const dy = targetY - pos[i3 + 1];
    const dz = targetZ - pos[i3 + 2];

    vel[i3] += dx * gravityStrength;
    vel[i3 + 1] += dy * gravityStrength;
    vel[i3 + 2] += dz * gravityStrength;

    // Apply damping and update position
    vel[i3] *= damping;
    vel[i3 + 1] *= damping;
    vel[i3 + 2] *= damping;

    pos[i3] += vel[i3];
    pos[i3 + 1] += vel[i3 + 1];
    pos[i3 + 2] += vel[i3 + 2];
  }

  // Step 4: Transfer positions buffer back to main thread
  // Create a copy or transfer the underlying ArrayBuffer
  const transferBuffer = pos.buffer.slice(0);
  (self as unknown as Worker).postMessage(
    { type: 'TICK', positions: transferBuffer },
    [transferBuffer]
  );
}
