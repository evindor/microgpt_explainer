import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

interface VectorEntry {
  to: [number, number, number];
  color: string;
  label?: string;
}

function VectorArrow({ to, color = '#f59e0b' }: { to: [number, number, number]; color?: string }) {
  const len = Math.sqrt(to[0] ** 2 + to[1] ** 2 + to[2] ** 2);

  const { quaternion, shaftLen, headLen } = useMemo(() => {
    const v = new THREE.Vector3(...to);
    const l = v.length();
    const hl = Math.min(0.25, l * 0.3);
    const sl = Math.max(0, l - hl);
    const dir = l > 0.001 ? v.normalize() : new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    if (dir.y < -0.9999) {
      q.set(0, 0, 1, 0);
    } else {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    }
    return { quaternion: q, shaftLen: sl, headLen: hl };
  }, [to]);

  if (len < 0.05) return null;

  return (
    <group quaternion={quaternion}>
      <mesh position={[0, shaftLen / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, shaftLen, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, shaftLen + headLen / 2, 0]}>
        <coneGeometry args={[0.12, headLen, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Axes() {
  const axes: { dir: [number, number, number]; color: string; label: string }[] = [
    { dir: [1, 0, 0], color: '#ef4444', label: 'X' },
    { dir: [0, 1, 0], color: '#22c55e', label: 'Y' },
    { dir: [0, 0, 1], color: '#3b82f6', label: 'Z' },
  ];

  return (
    <>
      {axes.map(({ dir, color, label }) => {
        const q = new THREE.Quaternion();
        const d = new THREE.Vector3(...dir);
        if (d.y < -0.9999) {
          q.set(0, 0, 1, 0);
        } else {
          q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        }
        return (
          <group key={label}>
            <group quaternion={q}>
              <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 3, 6]} />
                <meshStandardMaterial color={color} opacity={0.4} transparent />
              </mesh>
              <mesh position={[0, 3.05, 0]}>
                <coneGeometry args={[0.05, 0.12, 8]} />
                <meshStandardMaterial color={color} opacity={0.6} transparent />
              </mesh>
            </group>
            <Html
              position={[dir[0] * 3.35, dir[1] * 3.35, dir[2] * 3.35]}
              className="select-none pointer-events-none"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <span className="text-[10px] font-mono font-bold" style={{ color }}>{label}</span>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function FloorGrid() {
  const lines = useMemo(() => {
    const result: [number, number, number][][] = [];
    for (let i = -3; i <= 3; i++) {
      result.push([[i, 0, -3], [i, 0, 3]]);
      result.push([[-3, 0, i], [3, 0, i]]);
    }
    return result;
  }, []);

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#334155" lineWidth={0.5} />
      ))}
    </>
  );
}

function ProjectionLines({ to, color = '#f59e0b' }: { to: [number, number, number]; color?: string }) {
  const [x, y, z] = to;
  return (
    <>
      <Line points={[[x, y, z], [x, 0, z]]} color={color} lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
      <Line points={[[x, 0, z], [x, 0, 0]]} color="#94a3b8" lineWidth={0.5} dashed dashSize={0.08} gapSize={0.06} />
      <Line points={[[x, 0, z], [0, 0, z]]} color="#94a3b8" lineWidth={0.5} dashed dashSize={0.08} gapSize={0.06} />
    </>
  );
}

interface Vector3DSceneProps {
  vectors: VectorEntry[];
  showProjections?: boolean;
  autoRotate?: boolean;
}

export default function Vector3DScene({ vectors, showProjections, autoRotate = true }: Vector3DSceneProps) {
  const showProj = showProjections ?? vectors.length === 1;
  return (
    <div className="w-full h-[280px] rounded-lg overflow-hidden bg-slate-900/50">
      <Canvas camera={{ position: [5, 3.5, 5], fov: 40 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.7} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.5} />
        <FloorGrid />
        <Axes />
        {vectors.map((v, i) => (
          <group key={i}>
            <VectorArrow to={v.to} color={v.color} />
            {showProj && <ProjectionLines to={v.to} color={v.color} />}
            <mesh position={v.to}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color={v.color} emissive={v.color} emissiveIntensity={0.3} />
            </mesh>
            <Html
              position={[v.to[0] + (i === 0 ? 0.3 : -0.3), v.to[1] + 0.25, v.to[2]]}
              className="select-none pointer-events-none"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap border bg-slate-900/80"
                style={{ color: v.color, borderColor: v.color + '33' }}
              >
                {v.label ?? `(${v.to[0].toFixed(1)}, ${v.to[1].toFixed(1)}, ${v.to[2].toFixed(1)})`}
              </span>
            </Html>
          </group>
        ))}
      </Canvas>
    </div>
  );
}
