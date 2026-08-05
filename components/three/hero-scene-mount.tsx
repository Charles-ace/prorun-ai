"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { supportsWebGL } from "@/lib/webgl";

// Dynamically loads the WebGL scene on the client only (avoids SSR issues),
// and renders a static fallback when WebGL is unavailable.
const HeroScene = dynamic(
  () => import("@/components/three/hero-scene").then((m) => m.HeroScene),
  { ssr: false },
);

export function HeroSceneMount({ fallback }: { fallback: ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    setOk(supportsWebGL());
  }, []);

  if (ok === null) {
    // First paint — avoid layout jump by rendering fallback immediately.
    return <>{fallback}</>;
  }
  if (!ok) {
    return <>{fallback}</>;
  }
  return (
    <div className="relative h-full w-full" aria-label="Interactive 3D portfolio universe">
      <HeroScene />
    </div>
  );
}