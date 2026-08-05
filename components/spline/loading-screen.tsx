"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Logo } from "@/components/dashboard/sidebar";
import { SplineScene } from "@/components/spline/spline-scene";
import { cn } from "@/lib/format";

const STEPS = [
  "Initializing Prorun AI…",
  "Loading Portfolio Intelligence…",
  "Loading Market Data…",
  "Preparing AI Analysis…",
];

const STEP_MS = 1500;
const DONE_DELAY_MS = 650;

export function LoadingOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          window.clearInterval(id);
          window.setTimeout(() => {
            if (!doneRef.current) {
              doneRef.current = true;
              onDone();
            }
          }, DONE_DELAY_MS);
          return s;
        }
        return s + 1;
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [onDone]);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#07090D] px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo />
      </motion.div>

      <div className="relative mt-6 h-44 w-full max-w-md sm:h-52">
        <SplineScene variant="thinking" className="h-full w-full" />
      </div>

      <div className="mt-2 w-full max-w-sm space-y-2.5">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors duration-300",
                done ? "text-ink-faint" : active ? "text-ink" : "text-ink-faint/50",
              )}
            >
              <span
                className={cn(
                  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                  done
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                    : active
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10",
                )}
              >
                {done ? (
                  <Check size={10} />
                ) : active ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                ) : null}
              </span>
              {label}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 h-1 w-full max-w-sm overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/** Plays the boot sequence once per browser session, then fades into the dashboard. */
export function DashboardLoadingGate({ children }: { children: React.ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    let booted = false;
    try {
      booted = window.sessionStorage.getItem("prorun.booted.v1") === "1";
    } catch {
      /* storage unavailable */
    }
    if (!booted) setShowOverlay(true);
    try {
      window.sessionStorage.setItem("prorun.booted.v1", "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="prorun-loading"
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed inset-0 z-[80] overflow-hidden"
          >
            <LoadingOverlay onDone={() => setShowOverlay(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
