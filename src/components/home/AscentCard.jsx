import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import LiquidFill from "@/components/home/LiquidFill";
import { ART } from "@/lib/art";

const MOUNTAIN = ART.ascentMountains;

// Aesthetic Ascent card — liquid-fill phase progress with the current step
// meter and per-step bars. Extracted so both the mobile Home stack and the
// desktop Coach's Dashboard render the identical card.
//
// Phase-complete celebration (one time per phase, driven by ascent.celebrating):
// the liquid rises to 100%, a mountain image fades to full opacity, and the card
// swells with a blue glow (~600ms); the filled water then bursts into ~20 small
// brand-blue pixel squares that scatter outward and fade (~900ms); the mountain
// fades and the liquid settles to the next phase's level, revealing the next
// phase's steps. LiquidFill's normal behavior is untouched — it just receives a
// different pct while celebrating.
export default function AscentCard({ ascent }) {
  // Stage is owned by Home's single celebration timeline so this card stays in
  // sync with PhaseHero. "celebrating" is derived from the stage.
  const stage = ascent.stage && ascent.stage !== "idle" ? ascent.stage : "idle";
  const celebrating = stage !== "idle";

  const curStepPct =
    ascent.progress && ascent.progress.kind === "count"
      ? Math.min(100, Math.round((ascent.progress.current / ascent.progress.target) * 100))
      : 0;

  const squares = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: Math.random() * Math.PI * 2,
        dist: 70 + Math.random() * 130,
        size: 5 + Math.floor(Math.random() * 5),
        delay: Math.random() * 0.12,
      })),
    []
  );

  const fillPct =
    stage === "rising" ? 100 : stage === "burst" ? 0 : ascent.phasePct ?? 0;
  const mountainOpacity = stage === "rising" || stage === "burst" ? 1 : 0;
  const glowOn = stage === "rising" || stage === "burst";
  const showSquares = stage === "burst" || stage === "clearing";

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
      animate={{
        boxShadow: glowOn
          ? "0 0 48px rgba(30,155,255,0.55), 0 0 96px rgba(30,155,255,0.25)"
          : "0 0 0px rgba(30,155,255,0)",
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <LiquidFill pct={fillPct} />
      <motion.img
        src={MOUNTAIN}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        initial={false}
        animate={{ opacity: mountainOpacity }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Aesthetic Ascent</p>
          <Link to="/journey" className="text-foreground/30 transition-colors hover:text-accent">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
        <p className="mt-3 font-mono text-[11px] text-accent/70">{ascent.phaseLabel}</p>
        <p className="mt-1 font-display text-lg font-light leading-tight text-foreground">
          {ascent.stepLabel}
        </p>

        {ascent.progress && ascent.progress.kind !== "gate" && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/35">Current step</span>
              <span className="font-mono text-[11px] text-accent/80">
                {ascent.progress.kind === "count"
                  ? `${Math.min(ascent.progress.current, ascent.progress.target)}/${ascent.progress.target} ${ascent.progress.label}`
                  : "Coach-guided · tap to confirm"}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${curStepPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-accent glow-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          {ascent.steps.map((s, i) => {
            const v =
              s.status === "done"
                ? 100
                : s.progress && s.progress.kind === "count"
                ? Math.min(100, Math.round((s.progress.current / s.progress.target) * 100))
                : 0;
            return (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      s.status === "done"
                        ? "bg-accent"
                        : s.status === "active"
                        ? "bg-accent/70"
                        : "bg-white/15"
                    }`}
                  />
                  <span
                    className={`line-clamp-2 break-words leading-snug text-xs ${
                      s.status === "done"
                        ? "text-foreground/45"
                        : s.status === "active"
                        ? "text-foreground/85"
                        : "text-foreground/45"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                <div className="ml-4 mt-1 h-1 w-[calc(100%-1rem)] overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${v}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      s.status === "done" ? "bg-accent/50" : s.status === "active" ? "bg-accent" : "bg-accent/30"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showSquares && (
        <div className="pointer-events-none absolute inset-0 z-30">
          {squares.map((sq) => (
            <motion.span
              key={sq.id}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos(sq.angle) * sq.dist,
                y: Math.sin(sq.angle) * sq.dist,
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 0.9, delay: sq.delay, ease: "easeOut", opacity: { times: [0, 0.1, 0.7, 1] } }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: sq.size,
                height: sq.size,
                backgroundColor: "#1E9BFF",
                borderRadius: 1,
                boxShadow: "0 0 8px rgba(30,155,255,0.85), 0 0 16px rgba(30,155,255,0.4)",
                imageRendering: "pixelated",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}