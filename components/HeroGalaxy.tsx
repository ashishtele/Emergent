"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";

// Pure ambient background — no labels, no clicks, no hover.
// Just slow-drifting dust + faint constellation so headline stays king.
function Dust({ count = 220, dark }: { count?: number; dark: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(theta) * r * 0.6 - 1.5;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.02;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });

  return (
    // eslint-disable-next-line react/no-unknown-property
    <points ref={ref}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <bufferGeometry>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <pointsMaterial
        size={0.045}
        color={dark ? "#FAF7F1" : "#16130E"}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.6) * 0.1;
  });
  return (
    // eslint-disable-next-line react/no-unknown-property
    <mesh ref={ref} position={[0, 0, -1.5]}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <sphereGeometry args={[0.3, 32, 32]} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <meshStandardMaterial color="#E8500A" emissive="#E8500A" emissiveIntensity={1.1} roughness={0.3} />
    </mesh>
  );
}

export default function HeroGalaxy() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={
          dark
            ? "absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_32%,rgba(232,80,10,0.20),transparent_70%)]"
            : "absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_32%,rgba(232,80,10,0.10),transparent_70%)]"
        }
      />
      <div className="absolute inset-0 opacity-70">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.4, 7.8], fov: 48 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            {/* eslint-disable-next-line react/no-unknown-property */}
            <ambientLight intensity={dark ? 0.9 : 1.1} />
            {/* eslint-disable-next-line react/no-unknown-property */}
            <directionalLight position={[4, 5, 4]} intensity={1} />
            {/* eslint-disable-next-line react/no-unknown-property */}
            <pointLight position={[0, 0, 0]} color="#E8500A" intensity={5} distance={10} />
            <Stars radius={30} depth={20} count={400} factor={2} saturation={0} fade speed={0.3} />
            <Dust dark={dark} />
            <Core />
          </Suspense>
        </Canvas>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(58%_52%_at_50%_42%,transparent_40%,var(--hero-fade)_80%)] [ --hero-fade:#FAF7F1 ] dark:[ --hero-fade:#14100B ]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper to-transparent dark:from-coal" />
    </div>
  );
}
