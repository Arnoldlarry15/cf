import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store';
import { Memory } from '../types';
import { OctreeNode, OctreeItem } from '../utils/octree';
import { SyncEngine } from '../services/syncEngine';
import { WriteAheadLog } from '../services/writeAheadLog';
import { saveMemoryLocal, saveNodePositionsLocal } from '../services/storageEngine';

// App colors
const CATEGORY_COLORS: Record<string, string> = {
  Design: '#F43F5E',       // Rose
  Dev: '#0EA5E9',          // Sky
  Productivity: '#10B981', // Emerald
  Work: '#F59E0B',         // Amber
  Leisure: '#8B5CF6',      // Violet
};

const DEFAULT_COLOR = '#64748B';

const ANCHORS: Record<string, THREE.Vector3> = {
  Design: new THREE.Vector3(-10, 2, -5),
  Dev: new THREE.Vector3(10, -2, 5),
  Productivity: new THREE.Vector3(-2, 10, 4),
  Work: new THREE.Vector3(5, -8, -6),
  Leisure: new THREE.Vector3(-6, -5, 10),
};

// Instanced Mesh Node Renderer for 1,000+ Nodes at 60 FPS
function InstancedNodes({
  visibleMemories,
  positionsArray,
  selectedMemoryId,
  activeGraphFocusId,
  hoveredIndex,
  onSelectNode,
  onHoverNode
}: {
  visibleMemories: Memory[];
  positionsArray: Float32Array | null;
  selectedMemoryId: string | null;
  activeGraphFocusId: string | null;
  hoveredIndex: number | null;
  onSelectNode: (id: string) => void;
  onHoverNode: (index: number | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = visibleMemories.length;

  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useEffect(() => {
    if (!meshRef.current || !positionsArray || count === 0) return;

    const instancedMesh = meshRef.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positionsArray[i3];
      const y = positionsArray[i3 + 1];
      const z = positionsArray[i3 + 2];

      const memory = visibleMemories[i];
      const isSelected = selectedMemoryId === memory.id;
      const isFocused = activeGraphFocusId === memory.id;
      const isHovered = hoveredIndex === i;

      const scale = isSelected ? 1.5 : isHovered ? 1.25 : isFocused ? 1.3 : 1.0;
      dummyScale.set(scale, scale, scale);

      dummyMatrix.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(),
        dummyScale
      );
      instancedMesh.setMatrixAt(i, dummyMatrix);

      const baseHex = CATEGORY_COLORS[memory.category] || DEFAULT_COLOR;
      if (isSelected || isHovered) {
        dummyColor.set('#FAFAF9');
      } else {
        dummyColor.set(baseHex);
      }
      instancedMesh.setColorAt(i, dummyColor);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }, [positionsArray, visibleMemories, count, selectedMemoryId, activeGraphFocusId, hoveredIndex, dummyMatrix, dummyColor, dummyScale]);

  const handlePointerMove = useCallback((e: any) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      onHoverNode(e.instanceId);
    }
  }, [onHoverNode]);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();
    onHoverNode(null);
  }, [onHoverNode]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && visibleMemories[e.instanceId]) {
      onSelectNode(visibleMemories[e.instanceId].id);
    }
  }, [visibleMemories, onSelectNode]);

  if (count === 0 || !positionsArray || positionsArray.length < count * 3) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial
        roughness={0.15}
        metalness={0.8}
        emissive="#0ea5e9"
        emissiveIntensity={0.4}
      />
    </instancedMesh>
  );
}

// Custom camera controller for smooth focus transitions and free user interaction
function CameraController({
  positionsMap
}: {
  positionsMap: Record<string, THREE.Vector3>;
}) {
  const { camera } = useThree();
  const activeFocusId = useAppStore(state => state.activeGraphFocusId);
  const controlsRef = useRef<any>(null);

  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 25));
  const isUserInteracting = useRef(false);

  useEffect(() => {
    if (activeFocusId && positionsMap[activeFocusId]) {
      const nodePos = positionsMap[activeFocusId];
      targetLookAt.current.copy(nodePos);
      targetCamPos.current.copy(nodePos).add(new THREE.Vector3(3, 3, 8));
      isUserInteracting.current = false;
    } else if (Object.keys(positionsMap).length > 0) {
      const center = new THREE.Vector3();
      const nodeKeys = Object.keys(positionsMap);
      nodeKeys.forEach(k => center.add(positionsMap[k]));
      center.divideScalar(nodeKeys.length);

      targetLookAt.current.copy(center);
      targetCamPos.current.set(center.x, center.y, center.z + 24);
      isUserInteracting.current = false;
    }
  }, [activeFocusId, positionsMap]);

  useFrame(() => {
    if (!isUserInteracting.current) {
      camera.position.lerp(targetCamPos.current, 0.08);

      if (controlsRef.current) {
        const ctrlTarget = controlsRef.current.target;
        ctrlTarget.lerp(targetLookAt.current, 0.08);
        controlsRef.current.update();
      } else {
        camera.lookAt(targetLookAt.current);
      }
    } else if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxDistance={80}
      minDistance={1.5}
      onStart={() => {
        isUserInteracting.current = true;
      }}
    />
  );
}

// Edge Connection Line Component - Dual rendering for neon glowing wires
function GraphEdgeLine({
  start,
  end,
  weight,
  highlight,
  color
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  weight: number;
  highlight: boolean;
  color?: string;
}) {
  const points = useMemo(() => [start, end], [start, end]);
  const lineColor = color || '#38BDF8';

  return (
    <group>
      <Line
        points={points}
        color={highlight ? '#FAFAF9' : lineColor}
        lineWidth={highlight ? 2.5 : 1.2}
        transparent
        opacity={highlight ? 1.0 : 0.15 + weight * 0.35}
      />
      {(highlight || weight > 0.4) && (
        <Line
          points={points}
          color={lineColor}
          lineWidth={highlight ? 7.0 : 3.5}
          transparent
          opacity={highlight ? 0.35 : 0.12}
          blending={THREE.AdditiveBlending}
        />
      )}
    </group>
  );
}

// Background environment elements
function TechnoParadiseBackground() {
  const ringsRef = useRef<THREE.Group>(null);
  const structuresRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (ringsRef.current) {
      ringsRef.current.rotation.y = elapsed * 0.04;
      ringsRef.current.rotation.x = elapsed * 0.015;
    }
    if (structuresRef.current) {
      structuresRef.current.rotation.y = -elapsed * 0.02;
      structuresRef.current.children.forEach((child, i) => {
        child.rotation.x = elapsed * 0.06 * (i + 1);
        child.rotation.y = elapsed * 0.04 * (i + 1);
        child.position.y += Math.sin(elapsed * 0.8 + i) * 0.003;
      });
    }
  });

  return (
    <group>
      <gridHelper args={[120, 36, '#38bdf8', '#cbd5e1']} position={[0, -14, 0]} material-opacity={0.2} material-transparent={true} />
      <gridHelper args={[120, 36, '#c084fc', '#cbd5e1']} position={[0, 18, 0]} material-opacity={0.12} material-transparent={true} />

      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[35, 0.06, 8, 100]} />
          <meshBasicMaterial color="#f59e0b" opacity={0.16} transparent />
        </mesh>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[28, 0.05, 8, 100]} />
          <meshBasicMaterial color="#0ea5e9" opacity={0.18} transparent />
        </mesh>
        <mesh rotation={[Math.PI / 2, Math.PI / 6, 0]}>
          <torusGeometry args={[42, 0.07, 8, 100]} />
          <meshBasicMaterial color="#ec4899" opacity={0.14} transparent />
        </mesh>
      </group>

      <group ref={structuresRef}>
        <mesh position={[-25, 10, -18]}>
          <dodecahedronGeometry args={[4.5, 1]} />
          <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.08} />
        </mesh>
        <mesh position={[24, -9, -16]}>
          <icosahedronGeometry args={[5, 1]} />
          <meshBasicMaterial color="#ec4899" wireframe transparent opacity={0.08} />
        </mesh>
        <mesh position={[0, 15, -28]}>
          <octahedronGeometry args={[6.5, 0]} />
          <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.07} />
        </mesh>
      </group>
    </group>
  );
}

export default function MemorySpace3D() {
  const memories = useAppStore(state => state.memories);
  const selectedMemoryId = useAppStore(state => state.selectedMemoryId);
  const activeGraphFocusId = useAppStore(state => state.activeGraphFocusId);
  const selectMemory = useAppStore(state => state.selectMemory);
  const setGraphFocus = useAppStore(state => state.setGraphFocus);
  const timelineProgress = useAppStore(state => state.timelineProgress);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [positionsArray, setPositionsArray] = useState<Float32Array | null>(null);

  // Initialize Background Sync Engine for offline WAL flushing
  useEffect(() => {
    const syncEngine = SyncEngine.getInstance();
    syncEngine.startBackgroundSync(4000);
    return () => syncEngine.stopBackgroundSync();
  }, []);

  const { cutOffTime } = useMemo(() => {
    const list = memories || [];
    if (list.length === 0) return { cutOffTime: 0 };
    const times = list.map(m => new Date(m.timestamp).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const cutOff = min + ((max - min) * (timelineProgress / 100));
    return { cutOffTime: cutOff };
  }, [memories, timelineProgress]);

  const visibleMemories = useMemo(() => {
    return (memories || []).filter(m => m && m.timestamp && new Date(m.timestamp).getTime() <= cutOffTime);
  }, [memories, cutOffTime]);

  // Web Worker force layout initialization & ping-pong zero-copy messaging
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!visibleMemories || visibleMemories.length === 0) return;

    const worker = new Worker(new URL('../workers/layoutWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    const count = visibleMemories.length;
    const initialPositions = new Float32Array(count * 3);
    const anchorPositions = new Float32Array(count * 3);
    const idToIndexMap: Record<string, number> = {};

    (visibleMemories || []).forEach((m, idx) => {
      if (!m) return;
      idToIndexMap[m.id] = idx;

      const anchor = ANCHORS[m.category] || new THREE.Vector3(0, 0, 0);
      anchorPositions[idx * 3] = anchor.x;
      anchorPositions[idx * 3 + 1] = anchor.y;
      anchorPositions[idx * 3 + 2] = anchor.z;

      const seed = idx * 17.54;
      const r = 3.5 + (seed % 2.5);
      const theta = (seed * 1.3) % (Math.PI * 2);
      const phi = (seed * 2.7) % Math.PI;

      initialPositions[idx * 3] = anchor.x + r * Math.sin(phi) * Math.cos(theta);
      initialPositions[idx * 3 + 1] = anchor.y + r * Math.sin(phi) * Math.sin(theta);
      initialPositions[idx * 3 + 2] = anchor.z + r * Math.cos(phi);
    });

    const edgeList: Array<{ source: number; target: number; weight: number }> = [];
    (visibleMemories || []).forEach((m, srcIdx) => {
      if (!m) return;
      (m.relationships || []).forEach(rel => {
        if (!rel) return;
        const tgtIdx = idToIndexMap[rel.targetId];
        if (tgtIdx !== undefined) {
          edgeList.push({ source: srcIdx, target: tgtIdx, weight: rel.weight || 0.5 });
        }
      });
    });

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'TICK' && e.data.positions) {
        const updatedBuffer = new Float32Array(e.data.positions);
        setPositionsArray(updatedBuffer);

        const transferBack = updatedBuffer.buffer.slice(0);
        worker.postMessage({ type: 'UPDATE_POSITIONS', positions: transferBack }, [transferBack]);
      }
    };

    worker.postMessage({
      type: 'INIT',
      payload: {
        positions: initialPositions.buffer,
        anchors: anchorPositions.buffer,
        edges: edgeList
      }
    }, [initialPositions.buffer, anchorPositions.buffer]);

    return () => {
      worker.postMessage({ type: 'STOP' });
      worker.terminate();
      workerRef.current = null;
    };
  }, [visibleMemories]);

  // Build 3D Octree for spatial indexing and sub-millisecond hit detection
  const octreeRoot = useMemo(() => {
    if (!positionsArray || !visibleMemories || visibleMemories.length === 0) return null;
    const bounds = new THREE.Box3(
      new THREE.Vector3(-40, -40, -40),
      new THREE.Vector3(40, 40, 40)
    );
    const tree = new OctreeNode(bounds, 8, 0, 4);

    (visibleMemories || []).forEach((m, idx) => {
      if (!m) return;
      const idx3 = idx * 3;
      tree.insert({
        id: m.id,
        index: idx,
        position: new THREE.Vector3(
          positionsArray[idx3],
          positionsArray[idx3 + 1],
          positionsArray[idx3 + 2]
        )
      });
    });

    return tree;
  }, [positionsArray, visibleMemories]);

  // Positions dictionary map for camera controller and edge connections
  const positionsMap = useMemo(() => {
    const map: Record<string, THREE.Vector3> = {};
    if (!positionsArray || !visibleMemories) return map;

    (visibleMemories || []).forEach((m, idx) => {
      if (!m) return;
      const idx3 = idx * 3;
      const posVec = new THREE.Vector3(
        positionsArray[idx3],
        positionsArray[idx3 + 1],
        positionsArray[idx3 + 2]
      );
      map[m.id] = posVec;
    });

    // Save positions locally to IndexedDB for zero-latency resume
    if (Object.keys(map).length > 0) {
      saveNodePositionsLocal(
        Object.fromEntries(Object.entries(map).map(([k, v]) => [k, { x: v.x, y: v.y, z: v.z }]))
      );
    }

    return map;
  }, [positionsArray, visibleMemories]);

  // Generate edge connection list
  const edges = useMemo(() => {
    const list: Array<{ id: string; start: THREE.Vector3; end: THREE.Vector3; weight: number; highlight: boolean; color: string }> = [];
    (visibleMemories || []).forEach(m => {
      if (!m) return;
      const startPos = positionsMap[m.id];
      if (!startPos) return;

      (m.relationships || []).forEach(rel => {
        if (!rel) return;
        const endPos = positionsMap[rel.targetId];
        if (!endPos) return;

        const key = [m.id, rel.targetId].sort().join('-');
        if (list.some(e => e.id === key)) return;

        const isHighlight = selectedMemoryId === m.id || selectedMemoryId === rel.targetId;
        const color = CATEGORY_COLORS[m.category] || DEFAULT_COLOR;

        list.push({
          id: key,
          start: startPos,
          end: endPos,
          weight: rel.weight || 0.5,
          highlight: isHighlight,
          color: color
        });
      });
    });
    return list;
  }, [visibleMemories, positionsMap, selectedMemoryId]);

  const hoveredMemory = hoveredIndex !== null && visibleMemories[hoveredIndex] ? visibleMemories[hoveredIndex] : null;
  const hoveredPosition = hoveredMemory ? positionsMap[hoveredMemory.id] : null;

  return (
    <div className="w-full h-full relative bg-gradient-to-tr from-[#e0f2fe] via-[#fafbfd] to-[#fae8ff]">
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        gl={{ antialias: true }}
      >
        <fog attach="fog" args={["#f8fafc", 15, 55]} />

        <ambientLight intensity={0.85} />
        <directionalLight position={[15, 20, 10]} intensity={1.6} color="#fffdfa" />
        <directionalLight position={[-15, -10, -10]} intensity={0.6} color="#e2f1ff" />

        <pointLight position={[-12, 4, -6]} color="#F43F5E" intensity={2.0} distance={30} decay={1.3} />
        <pointLight position={[12, -4, 6]} color="#0EA5E9" intensity={2.0} distance={30} decay={1.3} />
        <pointLight position={[-3, 12, 5]} color="#10B981" intensity={1.5} distance={30} decay={1.3} />
        <pointLight position={[6, -10, -8]} color="#F59E0B" intensity={2.0} distance={30} decay={1.3} />
        <pointLight position={[-8, -6, 12]} color="#8B5CF6" intensity={2.0} distance={30} decay={1.3} />

        <Stars radius={120} depth={50} count={3500} factor={5} saturation={1.0} fade speed={1.2} />
        <Sparkles count={200} scale={35} size={2.5} speed={0.4} color="#f59e0b" opacity={0.75} />
        <Sparkles count={150} scale={30} size={1.8} speed={0.3} color="#06b6d4" opacity={0.7} />
        <Sparkles count={100} scale={32} size={1.5} speed={0.5} color="#ec4899" opacity={0.6} />

        <TechnoParadiseBackground />

        {/* Instanced Mesh Node Renderer */}
        <InstancedNodes
          visibleMemories={visibleMemories}
          positionsArray={positionsArray}
          selectedMemoryId={selectedMemoryId}
          activeGraphFocusId={activeGraphFocusId}
          hoveredIndex={hoveredIndex}
          onSelectNode={(id) => {
            selectMemory(id);
            setGraphFocus(id);
            // Log interaction into WAL queue
            WriteAheadLog.getInstance().append('UPDATE_NODE', { selectedId: id });
          }}
          onHoverNode={(index) => setHoveredIndex(index)}
        />

        {/* Render Connection Edges */}
        {edges.map(edge => (
          <GraphEdgeLine
            key={edge.id}
            start={edge.start}
            end={edge.end}
            weight={edge.weight}
            highlight={edge.highlight}
            color={edge.color}
          />
        ))}

        {/* Dynamic 3D-to-2D Spatial HUD Action Menu Overlay */}
        {hoveredMemory && hoveredPosition && (
          <Html position={[hoveredPosition.x, hoveredPosition.y + 1.2, hoveredPosition.z]} center distanceFactor={10}>
            <div className="bg-[#0a0a0f]/95 border border-blue-500/30 text-stone-200 text-[11px] p-2.5 rounded-xl font-sans shadow-[0_0_20px_rgba(59,130,246,0.3)] whitespace-nowrap pointer-events-auto select-none glass flex flex-col gap-1.5 min-w-[180px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="font-bold text-blue-400 uppercase text-[9px] tracking-wider">{hoveredMemory.application}</span>
                <span className="text-[9px] text-stone-400">{new Date(hoveredMemory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[10px] text-stone-200 truncate max-w-[200px] font-medium">{hoveredMemory.windowTitle}</p>
              
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectMemory(hoveredMemory.id);
                    setGraphFocus(hoveredMemory.id);
                  }}
                  className="bg-blue-600/80 hover:bg-blue-500 text-white text-[9px] px-2 py-1 rounded transition-colors"
                >
                  Focus Flight
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectMemory(hoveredMemory.id);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-stone-300 text-[9px] px-2 py-1 rounded transition-colors"
                >
                  Inspect
                </button>
              </div>
            </div>
          </Html>
        )}

        <CameraController positionsMap={positionsMap} />
      </Canvas>

      {/* Floating Category Legend */}
      <div className="absolute top-4 left-4 p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md pointer-events-none glass shadow-xl">
        <h4 className="text-xs font-semibold tracking-wider text-stone-400 uppercase mb-3">Cognitive Clusters (Instanced + WAL Sync)</h4>
        <div className="space-y-2">
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
              <span className="text-xs text-[#FAFAF9] font-medium">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
