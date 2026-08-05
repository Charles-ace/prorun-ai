"use client";

// Interactive 3D hero scene — a "portfolio universe": a particle globe of
// holdings pierced by orbiting tokens, wireframe shell, drifting particles
// and depth-of-field glow. Drag to spin, hover to parallax.
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars } from "@react-three/drei";

function ParticleGlobe() {
  const ref = useRef<THREE.Points>(null!);

  const { positions, colors } = useMemo(() => {
    const count = 2600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const a = new THREE.Color("#10b981");
    const c = new THREE.Color("#34d399");
    const b = new THREE.Color("#a3e635");
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 2.1 + Math.pow(Math.random(), 0.6) * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const t = Math.random();
      tmp.copy(t < 0.5 ? a : c).lerp(t < 0.5 ? c : b, (t % 0.5) * 2);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    return { positions, colors };
  }, []);

  useFrame((state, dt) => {
    const el = state.clock.elapsedTime;
    ref.current.rotation.y += dt * 0.1;
    ref.current.rotation.x = Math.sin(el * 0.15) * 0.12;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Shell() {
  return (
    <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.2}>
      <mesh>
        <icosahedronGeometry args={[2.55, 1]} />
        <meshBasicMaterial wireframe color="#34d399" transparent opacity={0.16} />
      </mesh>
    </Float>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 1.8) * 0.04;
    ref.current.scale.setScalar(pulse);
    (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.55 + Math.sin(t * 1.8) * 0.2;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.05, 48, 48]} />
      <meshStandardMaterial
        color="#070d0a"
        emissive="#10b981"
        emissiveIntensity={0.55}
        metalness={0.9}
        roughness={0.18}
      />
    </mesh>
  );
}

const TOKENS = [
  { pos: [4.4, 1.2, -0.4] as [number, number, number], color: "#f7931a", size: 0.18 },
  { pos: [-4.0, -0.9, 1.1] as [number, number, number], color: "#627eea", size: 0.16 },
  { pos: [1.0, 4.0, -1.3] as [number, number, number], color: "#9945ff", size: 0.14 },
  { pos: [-1.4, -4.0, 0.9] as [number, number, number], color: "#fbbf24", size: 0.13 },
  { pos: [3.6, -2.3, -1.5] as [number, number, number], color: "#38bdf8", size: 0.12 },
  { pos: [-3.2, 2.6, -1.8] as [number, number, number], color: "#fb7185", size: 0.11 },
];

function OrbitTokens() {
  const group = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    group.current.rotation.y += dt * 0.22;
  });
  return (
    <group ref={group}>
      {TOKENS.map((t, i) => (
        <Float key={i} speed={2.2} rotationIntensity={1.4} floatIntensity={1.6}>
          <mesh position={t.pos}>
            <sphereGeometry args={[t.size, 24, 24]} />
            <meshStandardMaterial
              color="#0a0f0c"
              emissive={t.color}
              emissiveIntensity={1.6}
              metalness={0.85}
              roughness={0.15}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function ParallaxRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      state.pointer.y * 0.22,
      0.06,
    );
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      state.pointer.x * 0.3,
      0.06,
    );
  });
  return <group ref={ref}>{children}</group>;
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8.6], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 5, 6]} intensity={60} color="#a3e635" />
      <pointLight position={[-6, -4, -3]} intensity={40} color="#10b981" />
      <pointLight position={[0, 0, 6]} intensity={20} color="#34d399" />
      <ParallaxRig>
        <Core />
        <ParticleGlobe />
        <Shell />
        <OrbitTokens />
      </ParallaxRig>
      <Stars radius={42} depth={28} count={1400} factor={3.2} saturation={0} fade speed={0.7} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.6}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}