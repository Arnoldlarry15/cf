import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store';
import { Memory } from '../types';

// App colors
const CATEGORY_COLORS: Record<string, string> = {
  Design: '#F43F5E',       // Rose
  Dev: '#0EA5E9',          // Sky
  Productivity: '#10B981', // Emerald
  Work: '#F59E0B',         // Amber
  Leisure: '#8B5CF6',      // Violet
};

const DEFAULT_COLOR = '#64748B';

// Calculate semantic coordinate layout
export function useComputedLayout(memories: Memory[], cutOffTime: number) {
  return useMemo(() => {
    const visibleMemories = memories.filter(m => new Date(m.timestamp).getTime() <= cutOffTime);
    
    // Step 1: Assign cluster anchors in 3D
    const anchors: Record<string, THREE.Vector3> = {
      Design: new THREE.Vector3(-10, 2, -5),
      Dev: new THREE.Vector3(10, -2, 5),
      Productivity: new THREE.Vector3(-2, 10, 4),
      Work: new THREE.Vector3(5, -8, -6),
      Leisure: new THREE.Vector3(-6, -5, 10),
    };

    // Step 2: Calculate initial node positions based on anchor + pseudo-random offset
    const positions: Record<string, THREE.Vector3> = {};
    visibleMemories.forEach((m, idx) => {
      const anchor = anchors[m.category] || new THREE.Vector3(0, 0, 0);
      
      // Use id-based deterministic math to keep coordinates stable
      const seed = idx * 17.54;
      const r = 3.5 + (seed % 2.5);
      const theta = (seed * 1.3) % (Math.PI * 2);
      const phi = (seed * 2.7) % Math.PI;

      const offset = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      positions[m.id] = anchor.clone().add(offset);
    });

    // Step 3: Run simplified force-directed attraction between connected nodes (2 passes to settle)
    for (let pass = 0; pass < 3; pass++) {
      visibleMemories.forEach(m => {
        const pos = positions[m.id];
        if (!pos) return;

        m.relationships.forEach(rel => {
          const targetPos = positions[rel.targetId];
          if (!targetPos) return;

          // Pull connected nodes closer together based on edge weight
          const dir = new THREE.Vector3().subVectors(targetPos, pos);
          const dist = dir.length();
          const targetDist = 4.0 / (rel.weight || 0.5); // ideal distance
          const pull = (dist - targetDist) * 0.12 * (rel.weight || 0.5);
          
          if (dist > 0.1) {
            dir.normalize().multiplyScalar(pull);
            positions[m.id].add(dir);
            positions[rel.targetId].sub(dir);
          }
        });
      });
    }

    return {
      visibleMemories,
      positions
    };
  }, [memories, cutOffTime]);
}

// Custom camera controller for smooth focus transitions and free user interaction
function CameraController({ positions }: { positions: Record<string, THREE.Vector3> }) {
  const { camera } = useThree();
  const activeFocusId = useAppStore(state => state.activeGraphFocusId);
  const controlsRef = useRef<any>(null);

  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 25));

  // State to track if user took over camera navigation
  const isUserInteracting = useRef(false);

  useEffect(() => {
    if (activeFocusId && positions[activeFocusId]) {
      const nodePos = positions[activeFocusId];
      targetLookAt.current.copy(nodePos);
      targetCamPos.current.copy(nodePos).add(new THREE.Vector3(3, 3, 8));
      // Reset interaction flag so the camera automatically flies to focus the newly selected node
      isUserInteracting.current = false;
    } else if (Object.keys(positions).length > 0) {
      // Calculate group center
      const center = new THREE.Vector3();
      const count = Object.keys(positions).length;
      Object.values(positions).forEach(p => center.add(p));
      center.divideScalar(count);
      
      targetLookAt.current.copy(center);
      targetCamPos.current.set(center.x, center.y, center.z + 24);
      isUserInteracting.current = false;
    }
  }, [activeFocusId, positions]);

  useFrame(() => {
    if (!isUserInteracting.current) {
      // Smoothly interpolate camera position & controls focus target
      camera.position.lerp(targetCamPos.current, 0.08);

      if (controlsRef.current) {
        const ctrlTarget = controlsRef.current.target;
        ctrlTarget.lerp(targetLookAt.current, 0.08);
        controlsRef.current.update();
      } else {
        camera.lookAt(targetLookAt.current);
      }
    } else {
      // If user has manual control, let OrbitControls handle camera positions and target with its beautiful damping
      if (controlsRef.current) {
        controlsRef.current.update();
      }
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

// Visual Node Component
function GraphNode({ 
  memory, 
  position, 
  isSelected, 
  isFocused,
  onSelect,
  isRecent
}: { 
  memory: Memory; 
  position: THREE.Vector3; 
  isSelected: boolean; 
  isFocused: boolean;
  onSelect: () => void;
  isRecent: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);
  const color = CATEGORY_COLORS[memory.category] || DEFAULT_COLOR;

  // De-synchronized phase offset based on memory title length to prevent synchronized pulsing
  const phaseOffset = useMemo(() => {
    return (memory.id.charCodeAt(0) || 0) * 0.5;
  }, [memory.id]);

  // Handle all visual scaling, rotation, and breathing states
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Core sphere breathing pulse
    if (meshRef.current) {
      const baseScale = isSelected ? 1.35 : hovered ? 1.15 : 1.0;
      const breathing = isRecent ? (1.0 + Math.sin(elapsed * 5.0 + phaseOffset) * 0.08) : 1.0;
      meshRef.current.scale.setScalar(baseScale * breathing);
    }

    // Outer volumetric glow breathing pulse
    if (haloRef.current) {
      const baseScale = isSelected ? 1.7 : hovered ? 1.4 : 1.15;
      const pulse = 1.0 + Math.sin(elapsed * 2.2 + phaseOffset) * 0.12;
      haloRef.current.scale.setScalar(baseScale * pulse);
    }

    // Spinning orbit ring
    if (ringRef.current) {
      ringRef.current.rotation.x = elapsed * 0.6 + phaseOffset;
      ringRef.current.rotation.y = elapsed * 0.4;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Node Core Physical Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <sphereGeometry args={[isSelected ? 0.65 : 0.5, 32, 32]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#FAFAF9' : color}
          emissive={color}
          emissiveIntensity={isSelected ? 2.5 : hovered ? 1.5 : 0.6}
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>

      {/* Volumetric Additive Breathing Aura */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[isSelected ? 0.95 : hovered ? 0.78 : 0.68, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.45 : hovered ? 0.32 : 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Real PointLight emitted from each node to illuminate the nearby cosmic web */}
      <pointLight 
        color={color} 
        intensity={isSelected ? 6.0 : hovered ? 3.5 : 0.55} 
        distance={isSelected ? 10.0 : hovered ? 6.5 : 2.5} 
        decay={1.8} 
      />

      {/* Spinning futuristic holographic orbital ring for selected or focused nodes */}
      {(isSelected || isFocused) && (
        <mesh ref={ringRef}>
          <torusGeometry args={[isSelected ? 1.3 : 1.0, 0.02, 8, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.5 : 0.25}
            wireframe
          />
        </mesh>
      )}

      {/* Text labels floating above nodes */}
      {(hovered || isSelected) && (
        <Html distanceFactor={10} position={[0, 1.2, 0]} center>
          <div className="bg-[#0a0a0f]/95 border border-blue-500/20 text-stone-200 text-[10px] px-2.5 py-1.5 rounded-lg font-sans shadow-[0_0_15px_rgba(59,130,246,0.2)] whitespace-nowrap pointer-events-none select-none glass">
            <span className="font-bold text-blue-400">{memory.application}:</span> {memory.windowTitle.slice(0, 24)}...
          </div>
        </Html>
      )}
    </group>
  );
}

// Edge Connection Line Component - Dual rendering for perfect neon glowing wires
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
      {/* Inner sharp laser connection core */}
      <Line
        points={points}
        color={highlight ? '#FAFAF9' : lineColor}
        lineWidth={highlight ? 2.5 : 1.2}
        transparent
        opacity={highlight ? 1.0 : 0.15 + weight * 0.35}
      />
      {/* Outer wide volumetric additive glowing halo line */}
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

// Immersive background visual elements representing a technological paradise
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
        // Add a very gentle floating breeze
        child.position.y += Math.sin(elapsed * 0.8 + i) * 0.003;
      });
    }
  });

  return (
    <group>
      {/* Techno Grid Floor - elegant glowing lines representing database architecture */}
      <gridHelper args={[120, 36, '#38bdf8', '#cbd5e1']} position={[0, -14, 0]} material-opacity={0.2} material-transparent={true} />
      
      {/* Techno Grid Ceiling */}
      <gridHelper args={[120, 36, '#c084fc', '#cbd5e1']} position={[0, 18, 0]} material-opacity={0.12} material-transparent={true} />

      {/* Futuristic Orbiting Rings / Data Spheres */}
      <group ref={ringsRef}>
        {/* Ring 1 - Golden outer bounds */}
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[35, 0.06, 8, 100]} />
          <meshBasicMaterial color="#f59e0b" opacity={0.16} transparent />
        </mesh>
        {/* Ring 2 - Blue equator */}
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[28, 0.05, 8, 100]} />
          <meshBasicMaterial color="#0ea5e9" opacity={0.18} transparent />
        </mesh>
        {/* Ring 3 - Pink longitudinal bounds */}
        <mesh rotation={[Math.PI / 2, Math.PI / 6, 0]}>
          <torusGeometry args={[42, 0.07, 8, 100]} />
          <meshBasicMaterial color="#ec4899" opacity={0.14} transparent />
        </mesh>
      </group>

      {/* Floating Sacred Tech Geometries / Polyhedral memory crystals in the horizon */}
      <group ref={structuresRef}>
        {/* Crystal 1 - Far left top */}
        <mesh position={[-25, 10, -18]}>
          <dodecahedronGeometry args={[4.5, 1]} />
          <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.08} />
        </mesh>
        {/* Crystal 2 - Far right bottom */}
        <mesh position={[24, -9, -16]}>
          <icosahedronGeometry args={[5, 1]} />
          <meshBasicMaterial color="#ec4899" wireframe transparent opacity={0.08} />
        </mesh>
        {/* Crystal 3 - Far background center */}
        <mesh position={[0, 15, -28]}>
          <octahedronGeometry args={[6.5, 0]} />
          <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.07} />
        </mesh>
        {/* Crystal 4 - Near far left bottom */}
        <mesh position={[-22, -10, -12]}>
          <torusGeometry args={[3.5, 0.9, 10, 24]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.07} />
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
  const timelineProgress = useAppStore(state => state.timelineProgress);

  // Determine cutoff time based on progress slider
  const { minTime, maxTime, cutOffTime } = useMemo(() => {
    if (memories.length === 0) {
      return { minTime: 0, maxTime: 0, cutOffTime: 0 };
    }
    const times = memories.map(m => new Date(m.timestamp).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const cutOff = min + ((max - min) * (timelineProgress / 100));
    return { minTime: min, maxTime: max, cutOffTime: cutOff };
  }, [memories, timelineProgress]);

  // Compute Layout positions dynamically
  const { visibleMemories, positions } = useComputedLayout(memories, cutOffTime);

  // Generate edge lists
  const edges = useMemo(() => {
    const list: Array<{ id: string; start: THREE.Vector3; end: THREE.Vector3; weight: number; highlight: boolean; color: string }> = [];
    visibleMemories.forEach(m => {
      const startPos = positions[m.id];
      if (!startPos) return;

      m.relationships.forEach(rel => {
        const endPos = positions[rel.targetId];
        if (!endPos) return;

        // Prevent rendering duplicate lines
        const key = [m.id, rel.targetId].sort().join('-');
        if (list.some(e => e.id === key)) return;

        const isHighlight = selectedMemoryId === m.id || selectedMemoryId === rel.targetId;
        const color = CATEGORY_COLORS[m.category] || DEFAULT_COLOR;

        list.push({
          id: key,
          start: startPos,
          end: endPos,
          weight: rel.weight,
          highlight: isHighlight,
          color: color
        });
      });
    });
    return list;
  }, [visibleMemories, positions, selectedMemoryId]);

  return (
    <div className="w-full h-full relative bg-gradient-to-tr from-[#e0f2fe] via-[#fafbfd] to-[#fae8ff]">
      {/* 3D Canvas rendering */}
      <Canvas
        camera={{ position: [0, 0, 25], fov: 60 }}
        gl={{ antialias: true }}
      >
        {/* Soft elegant fog to blend distant nodes beautifully into the horizon */}
        <fog attach="fog" args={["#f8fafc", 15, 55]} />

        {/* Comforting ambient light and bright sun lights */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[15, 20, 10]} intensity={1.6} color="#fffdfa" />
        <directionalLight position={[-15, -10, -10]} intensity={0.6} color="#e2f1ff" />

        {/* Volumetric cloud lighting at cluster anchors to simulate neon technicolor nebulae */}
        <pointLight position={[-12, 4, -6]} color="#F43F5E" intensity={2.0} distance={30} decay={1.3} />
        <pointLight position={[12, -4, 6]} color="#0EA5E9" intensity={2.0} distance={30} decay={1.3} />
        <pointLight position={[-3, 12, 5]} color="#10B981" intensity={1.5} distance={30} decay={1.3} />
        <pointLight position={[6, -10, -8]} color="#F59E0B" intensity={2.0} distance={30} decay={1.3} />
        <pointLight position={[-8, -6, 12]} color="#8B5CF6" intensity={2.0} distance={30} decay={1.3} />

        {/* Sparkling cyber-diamond dust background stars */}
        <Stars radius={120} depth={50} count={3500} factor={5} saturation={1.0} fade speed={1.2} />

        {/* Drifting golden, cyan, and rose data-droplets / sparkles */}
        <Sparkles count={200} scale={35} size={2.5} speed={0.4} color="#f59e0b" opacity={0.75} />
        <Sparkles count={150} scale={30} size={1.8} speed={0.3} color="#06b6d4" opacity={0.7} />
        <Sparkles count={100} scale={32} size={1.5} speed={0.5} color="#ec4899" opacity={0.6} />

        {/* Technological Paradise Background elements */}
        <TechnoParadiseBackground />

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

        {/* Render Memory Nodes */}
        {visibleMemories.map(m => {
          const pos = positions[m.id];
          if (!pos) return null;

          const isSelected = selectedMemoryId === m.id;
          const isFocused = activeGraphFocusId === m.id;
          
          // Determine if node was created in the last 15% of the timeline cutoff for a dynamic scale-pop
          const mTime = new Date(m.timestamp).getTime();
          const isRecent = cutOffTime - mTime < (maxTime - minTime) * 0.05 && cutOffTime - mTime >= 0;

          return (
            <GraphNode
              key={m.id}
              memory={m}
              position={pos}
              isSelected={isSelected}
              isFocused={isFocused}
              onSelect={() => selectMemory(m.id)}
              isRecent={isRecent}
            />
          );
        })}

        {/* Cinematic Animated Camera and Controls */}
        <CameraController positions={positions} />
      </Canvas>

      {/* Floating Category Legend */}
      <div className="absolute top-4 left-4 p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md pointer-events-none glass shadow-xl">
        <h4 className="text-xs font-semibold tracking-wider text-stone-400 uppercase mb-3">Cognitive Clusters</h4>
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
