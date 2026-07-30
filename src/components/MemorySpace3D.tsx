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
  const count = visibleMemories ? visibleMemories.length : 0;

  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useEffect(() => {
    if (!meshRef.current || !positionsArray || count === 0) return;

    const instancedMesh = meshRef.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      if (i3 + 2 >= positionsArray.length) break;

      const x = positionsArray[i3];
      const y = positionsArray[i3 + 1];
      const z = positionsArray[i3 + 2];

      const memory = visibleMemories[i];
      if (!memory || !memory.id) continue;

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

      const baseHex = (memory.category && CATEGORY_COLORS[memory.category]) || DEFAULT_COLOR;
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
    const instanceId = e.instanceId;
    if (instanceId !== undefined && instanceId !== null && instanceId >= 0 && visibleMemories && instanceId < visibleMemories.length) {
      const targetNode = visibleMemories[instanceId];
      if (targetNode && targetNode.id) {
        onHoverNode(instanceId);
        return;
      }
    }
    onHoverNode(null);
  }, [visibleMemories, onHoverNode]);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();
    onHoverNode(null);
  }, [onHoverNode]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId === undefined || instanceId === null) return;

    // Guard 1: Index boundary check
    if (!visibleMemories || instanceId < 0 || instanceId >= visibleMemories.length) return;

    // Guard 2: Reject NaN or Infinity coordinates from worker/buffer read
    if (positionsArray) {
      const i3 = instanceId * 3;
      if (i3 + 2 < positionsArray.length) {
        const targetX = positionsArray[i3];
        const targetY = positionsArray[i3 + 1];
        const targetZ = positionsArray[i3 + 2];

        if (!Number.isFinite(targetX) || !Number.isFinite(targetY) || !Number.isFinite(targetZ)) {
          console.warn(`[MemorySpace3D] Invalid target coordinates for node ${instanceId}:`, { targetX, targetY, targetZ });
          return;
        }
      }
    }

    const targetNode = visibleMemories[instanceId];
    if (targetNode && targetNode.id) {
      onSelectNode(targetNode.id);
    } else {
      console.warn(`Click registered on instanceId ${instanceId}, but no matching node was found.`);
    }
  }, [visibleMemories, positionsArray, onSelectNode]);

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

function isFiniteVector(vec: THREE.Vector3 | null | undefined): boolean {
  return !!vec && Number.isFinite(vec.x) && Number.isFinite(vec.y) && Number.isFinite(vec.z);
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
  const isFlying = useRef(false);
  const lastFocusId = useRef<string | null>(null);

  useEffect(() => {
    if (activeFocusId && positionsMap[activeFocusId] && activeFocusId !== lastFocusId.current) {
      const nodePos = positionsMap[activeFocusId];

      // Guard 1: Validate target node position
      if (isFiniteVector(nodePos)) {
        lastFocusId.current = activeFocusId;
        targetLookAt.current.copy(nodePos);

        // Guard 2: Compute camera flight target offset safely (prevent zero-distance precision / NaN error)
        const offset = new THREE.Vector3().subVectors(camera.position, nodePos);
        if (offset.lengthSq() < 0.0001) {
          offset.set(0, 0, 5);
        } else {
          offset.normalize().multiplyScalar(5);
        }

        const destination = new THREE.Vector3().addVectors(nodePos, offset);
        if (isFiniteVector(destination)) {
          targetCamPos.current.copy(destination);
          isFlying.current = true;

          // Guard 3: Explicitly lock/reset OrbitControls target before flight
          if (controlsRef.current) {
            controlsRef.current.target.copy(nodePos);
          }
        }
      } else {
        console.warn(`[MemorySpace3D] Invalid target coordinates for focus node ${activeFocusId}:`, nodePos);
      }
    } else if (!activeFocusId && Object.keys(positionsMap).length > 0 && lastFocusId.current !== 'default') {
      lastFocusId.current = 'default';
      const center = new THREE.Vector3();
      const nodeKeys = Object.keys(positionsMap);
      let validCount = 0;
      nodeKeys.forEach(k => {
        const p = positionsMap[k];
        if (isFiniteVector(p)) {
          center.add(p);
          validCount++;
        }
      });
      if (validCount > 0) {
        center.divideScalar(validCount);
        targetLookAt.current.copy(center);
        targetCamPos.current.set(center.x, center.y, center.z + 25);
        isFlying.current = true;

        if (controlsRef.current) {
          controlsRef.current.target.copy(center);
        }
      }
    }
  }, [activeFocusId, positionsMap, camera.position]);

  useFrame(() => {
    if (!controlsRef.current) return;

    if (isFlying.current) {
      // Guard 4: Validate flight targets before lerping
      if (!isFiniteVector(targetCamPos.current) || !isFiniteVector(targetLookAt.current)) {
        console.warn('[MemorySpace3D] Target vector contained NaN/Infinity, cancelling flight');
        isFlying.current = false;
        return;
      }

      camera.position.lerp(targetCamPos.current, 0.08);
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);

      // Guard 5: Safety check for NaN camera vector & view matrix recovery
      if (!isFiniteVector(camera.position) || !isFiniteVector(controlsRef.current.target)) {
        console.warn('[MemorySpace3D] Camera position became NaN during lerp, resetting to default');
        camera.position.set(0, 0, 25);
        controlsRef.current.target.set(0, 0, 0);
        isFlying.current = false;
        controlsRef.current.update();
        return;
      }

      controlsRef.current.update();

      const distCam = camera.position.distanceTo(targetCamPos.current);
      const distTarget = controlsRef.current.target.distanceTo(targetLookAt.current);

      // Guard 6: Release controls if lerp distance gets stuck or hits boundary/NaN
      if (
        isNaN(distCam) ||
        isNaN(distTarget) ||
        !Number.isFinite(distCam) ||
        !Number.isFinite(distTarget) ||
        (distCam < 0.05 && distTarget < 0.05)
      ) {
        isFlying.current = false;
        if (controlsRef.current) controlsRef.current.update();
      }
    } else {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={true}
      dampingFactor={0.05}
      enablePan={true}
      panSpeed={1.5}
      rotateSpeed={0.8}
      zoomSpeed={1.2}
      maxDistance={120}
      minDistance={1.5}
      onStart={() => {
        isFlying.current = false;
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
      if (!e || !e.data) return;
      const rawPositions = e.data.positions || (e.data.payload && e.data.payload.positions);
      if (rawPositions) {
        const updatedBuffer = new Float32Array(rawPositions);
        setPositionsArray(updatedBuffer);

        if (e.data.type === 'TICK') {
          const transferBack = updatedBuffer.buffer.slice(0);
          if (workerRef.current) {
            workerRef.current.postMessage(
              { type: 'UPDATE_POSITIONS', positions: transferBack, payload: { positions: transferBack } },
              [transferBack]
            );
          }
        }
        // If type === 'SETTLED', worker physics cooling has completed - stop posting back to preserve 60FPS
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
      if (!m || !m.id) return;
      const idx3 = idx * 3;
      if (idx3 + 2 >= positionsArray.length) return;

      const x = positionsArray[idx3];
      const y = positionsArray[idx3 + 1];
      const z = positionsArray[idx3 + 2];

      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        map[m.id] = new THREE.Vector3(x, y, z);
      }
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

  const hoveredMemory = (hoveredIndex !== null && hoveredIndex >= 0 && visibleMemories && hoveredIndex < visibleMemories.length)
    ? visibleMemories[hoveredIndex]
    : null;

  const activeDisplayMemory = hoveredMemory || (selectedMemoryId ? visibleMemories.find(m => m && m.id === selectedMemoryId) : null);

  const activeDisplayPosition = useMemo(() => {
    if (!activeDisplayMemory || !activeDisplayMemory.id) return null;
    const pos = positionsMap[activeDisplayMemory.id];
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z)) {
      return pos;
    }
    return null;
  }, [activeDisplayMemory, positionsMap]);

  return (
    <div className="w-full h-full relative bg-gradient-to-tr from-[#e0f2fe] via-[#fafbfd] to-[#fae8ff]">
      <ThreeCanvasErrorBoundary>
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
              if (!id) return;
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
          {activeDisplayMemory && activeDisplayPosition && (
            <Html
              position={[
                Number.isFinite(activeDisplayPosition.x) ? activeDisplayPosition.x : 0,
                Number.isFinite(activeDisplayPosition.y) ? activeDisplayPosition.y + 0.8 : 0.8,
                Number.isFinite(activeDisplayPosition.z) ? activeDisplayPosition.z : 0
              ]}
              center
              distanceFactor={9}
              zIndexRange={[100, 0]}
              className="pointer-events-none select-none z-50"
            >
              <div className="bg-[#090d16]/90 backdrop-blur-md border border-cyan-500/40 text-stone-200 text-[11px] p-2.5 rounded-lg font-sans shadow-2xl pointer-events-auto select-none flex flex-col gap-1.5 min-w-[190px] max-w-[240px] transition-all duration-150 ease-out">
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="font-bold text-[#38bdf8] font-mono uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {String(activeDisplayMemory.application || activeDisplayMemory.category || 'Memory')}
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono">
                    {activeDisplayMemory.timestamp
                      ? new Date(activeDisplayMemory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
                <h3 className="text-[11px] text-slate-100 font-bold truncate">
                  {String(activeDisplayMemory.windowTitle || (activeDisplayMemory as any).title || 'Untitled Memory')}
                </h3>
                <p className="text-[10px] text-slate-300 line-clamp-2 leading-tight whitespace-normal font-sans">
                  {String(
                    activeDisplayMemory.summary ||
                    activeDisplayMemory.ocrText ||
                    (activeDisplayMemory as any).content ||
                    ''
                  )
                    .replace(/^(Snippet Extractor:\s*Captured snippet|Analyzed capture of|Captured terminal or application state for)\s*/i, '')
                    .trim() || 'No preview available'}
                </p>
                {activeDisplayMemory.tags && activeDisplayMemory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {activeDisplayMemory.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[8px] px-1.5 py-0.5 rounded-full font-mono">#{String(t)}</span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectMemory(activeDisplayMemory.id);
                      setGraphFocus(activeDisplayMemory.id);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all shadow-sm cursor-pointer"
                  >
                    Focus Flight
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectMemory(activeDisplayMemory.id);
                    }}
                    className="bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white border border-white/10 text-[9px] font-medium px-2 py-0.5 rounded-md transition-all cursor-pointer"
                  >
                    Inspect
                  </button>
                  {selectedMemoryId === activeDisplayMemory.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectMemory(null);
                        setGraphFocus(null);
                      }}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-[9px] px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ml-auto"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </Html>
          )}

          <CameraController positionsMap={positionsMap} />
        </Canvas>
      </ThreeCanvasErrorBoundary>

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

// React Error Boundary for 3D Canvas
class ThreeCanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MemorySpace3D ErrorBoundary] Caught exception in 3D canvas:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f] text-stone-300 p-6 text-center space-y-4 rounded-2xl border border-red-500/20">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl max-w-md">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">3D Mindmap Renderer Interrupted</p>
            <p className="text-[11px] text-stone-400 mt-2 font-mono leading-relaxed">
              {this.state.error?.message || 'A WebGL matrix panic or animation frame exception occurred.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-lg"
          >
            Reset 3D Mindmap View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

