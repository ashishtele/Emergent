"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
// r3f-globe ships without perfect TS props, so we loosen it once here
import GlobeImpl from "r3f-globe";
const R3fGlobe = GlobeImpl as any;

type GlobePoint = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  size: number;
  works?: number;
};

const FALLBACK: GlobePoint[] = [
  { name: "MIT", lat: 42.36, lng: -71.09, size: 0.9, works: 520000 },
  { name: "Stanford", lat: 37.43, lng: -122.17, size: 0.85, works: 480000 },
  { name: "Oxford", lat: 51.75, lng: -1.25, size: 0.8, works: 450000 },
  { name: "ETH Zurich", lat: 47.37, lng: 8.54, size: 0.6, works: 280000 },
  { name: "Univ. of Tokyo", lat: 35.71, lng: 139.76, size: 0.65, works: 310000 },
  { name: "Tsinghua Univ.", lat: 40.0, lng: 116.32, size: 0.7, works: 350000 },
  { name: "IIT Bombay", lat: 19.13, lng: 72.91, size: 0.45, works: 120000 },
  { name: "Univ. of São Paulo", lat: -23.56, lng: -46.73, size: 0.5, works: 180000 },
  { name: "Univ. of Cape Town", lat: -33.95, lng: 18.46, size: 0.35, works: 90000 },
  { name: "ANU Canberra", lat: -35.28, lng: 149.12, size: 0.4, works: 110000 },
];

function shortId(url?: string) {
  return url?.split("/").pop() ?? url ?? "";
}

export default function InstitutionsGlobe() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  const router = useRouter();
  const [points, setPoints] = useState<GlobePoint[]>(FALLBACK);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/search?type=institutions&q=university")
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.results?.length) return;
        const mapped: GlobePoint[] = d.results
          .filter((x: any) => x?.geo?.latitude && x?.geo?.longitude)
          .slice(0, 30)
          .map((x: any) => ({
            id: shortId(x.id),
            name: x.display_name,
            lat: x.geo.latitude,
            lng: x.geo.longitude,
            size: 0.3 + Math.min(Math.log10((x.works_count ?? 1000) + 1) / 6, 0.9),
            works: x.works_count,
          }));
        if (mapped.length >= 4) setPoints(mapped);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arcs = useMemo(() => {
    if (points.length < 2) return [];
    const hub = points[0];
    // hub -> next 6, like the satellites example but collaborations not orbits
    return points.slice(1, 7).map((p) => ({
      startLat: hub.lat,
      startLng: hub.lng,
      endLat: p.lat,
      endLng: p.lng,
      name: `${hub.name} ↔ ${p.name}`,
    }));
  }, [points]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink/10 dark:border-white/10">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Live map</p>
          <h2 className="font-display text-xl font-bold">Where research lives</h2>
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {points.length} institutions · drag to orbit · hover a dot{hovered ? ` — ${hovered}` : ""}
        </p>
      </div>
      <div className="h-[440px] w-full cursor-grab active:cursor-grabbing md:h-[520px]">
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 30, 285], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            {/* eslint-disable-next-line react/no-unknown-property */}
            <ambientLight intensity={1.1} />
            {/* eslint-disable-next-line react/no-unknown-property */}
            <directionalLight position={[100, 60, 80]} intensity={1} />
            <R3fGlobe
              globeImageUrl={
                dark
                  ? "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
                  : "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
              }
              bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(0,0,0,0)"
              atmosphereColor={dark ? "#E8500A" : "#7DD3FC"}
              atmosphereAltitude={0.18}
              pointsData={points}
              pointLat="lat"
              pointLng="lng"
              pointLabel={(d: any) =>
                `${d.name}${d.works ? ` · ${Number(d.works).toLocaleString()} works` : ""}`
              }
              pointColor={() => (hovered ? "#E8500A" : dark ? "#FAF7F1" : "#E8500A")}
              pointAltitude={0.02}
              pointRadius="size"
              pointResolution={16}
              onPointHover={(d: any) =>
                setHovered(d && typeof d === "object" && typeof d.name === "string" ? d.name : null)
              }
              onPointClick={(d: any) => {
                if (!d || typeof d !== "object" || typeof d.name !== "string" || !d.name) return;
                if (d.id && typeof d.id === "string")
                  router.push(`/institutions/${encodeURIComponent(d.id)}`);
                else router.push(`/search?q=${encodeURIComponent(d.name)}&type=institutions`);
              }}
              arcsData={arcs}
              arcStartLat="startLat"
              arcStartLng="startLng"
              arcEndLat="endLat"
              arcEndLng="endLng"
              arcLabel="name"
              arcColor={() => (dark ? "rgba(232,80,10,0.65)" : "rgba(232,80,10,0.55)")}
              arcAltitude={0.22}
              arcStroke={0.7}
              arcDashLength={0.5}
              arcDashGap={0.25}
              arcDashAnimateTime={2500}
            />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              rotateSpeed={0.45}
              autoRotate
              autoRotateSpeed={0.5}
              minPolarAngle={Math.PI * 0.2}
              maxPolarAngle={Math.PI * 0.85}
            />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent dark:from-coal" />
    </div>
  );
}

// keep Next from SSR-ing WebGL at build time when used via `dynamic(ssr:false)` anyway
export const InstitutionsGlobeDynamic = dynamic(() => Promise.resolve(InstitutionsGlobe), { ssr: false });
