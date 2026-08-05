"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Application } from "@splinetool/runtime";
import { cn } from "@/lib/format";

export const SPLINE_SCENE_URL = "/prorun-scene.spline";

export type SplineSceneVariant = "hero" | "ambient" | "thinking";

interface SplineSceneProps {
  variant?: SplineSceneVariant;
  className?: string;
  processing?: boolean;
  interactive?: boolean;
  onReady?: () => void;
}

/**
 * Renders the Spline scene. The runtime is lazy-loaded on first mount so the
 * page stays fast; a fallback orb shows while WebGL initializes.
 * Built-in Spline animations run continuously; nothing about the geometry,
 * lighting or timing of the scene is changed.
 */
export function SplineScene({
  variant = "hero",
  className,
  processing = false,
  interactive = false,
  onReady,
}: SplineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let disposed = false;
    let app: Application | null = null;
    let cancelled = false;

    (async () => {
      const { Application: SplineApp } = await import("@splinetool/runtime");
      if (disposed || !canvasRef.current) {
        cancelled = true;
        return;
      }
      app = new SplineApp(canvasRef.current, { renderMode: "continuous" });

      // Enable pointer-driven interaction (Spline mouse events) when wanted.
      if (interactive) {
        app.addEventListener("mouseDown", () => undefined);
        app.addEventListener("mouseUp", () => undefined);
        app.addEventListener("mouseHover", () => undefined);
      }

      try {
        await app.load(SPLINE_SCENE_URL);
        if (disposed) return;
        setLoaded(true);
        onReady?.();
      } catch (err) {
        // WebGL unsupported or scene failed to init — keep the fallback visible.
        console.error("Spline scene failed to load", err);
      }
    })();

    return () => {
      disposed = true;
      void cancelled;
      try {
        app?.dispose();
      } catch {
        /* already disposed */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className={cn("relative overflow-hidden", className)}
      aria-hidden={variant === "ambient"}
    >
      {/* radial glow so the scene emerges from the darkness */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(0,229,255,0.12), transparent 70%)",
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={
          processing
            ? {
                scale: 1.04,
                rotate: [0, 2.5, -1.5, 0],
                filter: ["brightness(1)", "brightness(1.22)", "brightness(1)"],
                opacity: [0.85, 1, 0.85],
              }
            : variant === "hero"
              ? { y: [0, -10, 0] }
              : { opacity: 1 }
        }
        transition={
          processing
            ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 1s ease" }}
        />
      </motion.div>

      {/* loading fallback while the scene initializes */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="h-16 w-16 animate-pulse rounded-full bg-cyan-400/10 blur-md" />
            <div className="absolute inset-0 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/20">
              <span className="h-2 w-2 animate-ping rounded-full bg-cyan-300/70" />
            </div>
          </div>
          <span className="sr-only">Loading 3D scene</span>
        </div>
      )}
    </motion.div>
  );
}