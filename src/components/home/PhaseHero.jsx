import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const PHASE_BANNERS = {
  1: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/2c5430388_003-phase1-foundation-banner.png",
  2: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/e1cb53396_006A-phase2-walls-banner.png",
  3: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/61116920d_006B-phase3-city-banner.png",
  4: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/b53849dbf_006C-phase4-zenith-banner.png",
};

const BASE_IMG =
  "pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[600ms] ease-in-out";

const MotionLink = motion(Link);

// Home hero: the member's current journey phase as the headline element.
// Phase name, a large glowing percentage of that phase's steps completed,
// the current step name, and a glowing progress bar. Taps to the Journey
// screen. Presentation only — all values are computed upstream.
//
// During the phase-complete celebration, Home drives a single timeline via
// `celebration.stage` so this hero plays in sync with the Ascent card. While
// the celebration runs the hero holds the COMPLETED phase (its label, last
// step, bar + percentage at 100%) and only switches to the next phase at the
// cross-fade step — mirroring how the Ascent card holds its old state.
//   rising  (~600ms): completing banner fades to full opacity, bar sweeps to
//     100%, the big percentage pulses once.
//   burst   (~900ms): blue glow swells, a left-to-right light sweep crosses the
//     card, a brief subtle shake (2–3 horizontal oscillations, ~250ms), and
//     the bar shatters into brand-blue pixel squares that scatter and fade.
//   clearing (~400ms): cross-fade to the next phase — label becomes
//     "PHASE {N+1} · {NAME}", current step becomes that phase's first step,
//     bar and percentage reset to the derived (next) phase's real progress.
export default function PhaseHero({ phaseLabel, stepLabel, pct, celebration }) {
  const stage = celebration && celebration.stage && celebration.stage !== "idle" ? celebration.stage : "idle";
  const celeb = stage !== "idle" ? celebration : null;

  const pm = /Phase\s+(\d+)/i.exec(phaseLabel || "");
  const nextPhaseNum = pm ? Math.min(4, Math.max(1, parseInt(pm[1], 10))) : 4;
  const completingPhaseNum = celeb ? celeb.completingPhaseNum || nextPhaseNum : nextPhaseNum;

  const showCompleting = stage === "rising" || stage === "burst";
  const displayLabel = showCompleting ? celeb.completingLabel || phaseLabel : phaseLabel;
  const displayStep = showCompleting ? celeb.completingStep || stepLabel : stepLabel;
  const displayPct = showCompleting ? 100 : pct;

  const glowOn = stage === "burst";
  const shatterOn = stage === "burst";
  const sweepOn = stage === "burst";

  const squares = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        xPct: (i / 15) * 100,
        angle: -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1,
        dist: 36 + Math.random() * 64,
        size: 4 + Math.floor(Math.random() * 4),
        delay: Math.random() * 0.12,
      })),
    []
  );

  // Shake: 2–3 small horizontal oscillations over ~250ms. Memoized so the
  // keyframe array is stable across re-renders and plays once per burst.
  const shakeKeyframes = useMemo(() => [0, -6, 5, -4, 3, 0], []);

  const bannerOpacity = (key) => {
    if (!celeb) return undefined;
    const isCompleting = Number(key) === completingPhaseNum;
    const isNext = Number(key) === nextPhaseNum;
    if (showCompleting) return isCompleting ? 1 : 0;
    return isNext ? 0.5 : 0;
  };

  const cardAnimate = {
    x: stage === "burst" ? shakeKeyframes : 0,
    boxShadow: glowOn
      ? "0 0 48px rgba(30,155,255,0.55), 0 0 96px rgba(30,155,255,0.25)"
      : "0 0 0px rgba(30,155,255,0)",
  };

  return (
    <MotionLink
      to="/journey"
      className="group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-accent/30"
      animate={cardAnimate}
      transition={{ x: { duration: 0.25, ease: "easeInOut" }, boxShadow: { duration: 0.45, ease: "easeOut" } }}
    >
      {Object.entries(PHASE_BANNERS).map(([key, src]) => (
        <img
          key={key}
          src={src}
          alt=""
          aria-hidden="true"
          className={
            celeb
              ? BASE_IMG
              : `${BASE_IMG} ${Number(key) === nextPhaseNum ? "opacity-50 group-hover:opacity-85" : "opacity-0"}`
          }
          style={celeb ? { opacity: bannerOpacity(key) } : undefined}
        />
      ))}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-in-out group-hover:opacity-60"
        style={{ background: "linear-gradient(to right, rgba(5,10,20,0.85), rgba(5,10,20,0.2))" }}
      />
      {sweepOn && (
        <motion.div
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 z-20"
          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(30,155,255,0.28) 50%, transparent 70%)" }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Your phase</p>
          <ArrowUpRight className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
        </div>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent/70">{displayLabel}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/35">Current step</p>
            <p className="mt-0.5 truncate font-display text-lg font-light leading-tight text-foreground">{displayStep}</p>
          </div>
          <motion.p
            animate={stage === "rising" ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="shrink-0 font-display text-[2.5rem] font-bold text-accent text-glow"
          >
            {displayPct}%
          </motion.p>
        </div>
        <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={false}
            animate={{ width: `${displayPct}%`, opacity: shatterOn ? 0 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-accent glow-sm"
          />
          {shatterOn && (
            <div className="pointer-events-none absolute inset-0">
              {squares.map((sq) => (
                <motion.span
                  key={sq.id}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos(sq.angle) * sq.dist,
                    y: Math.sin(sq.angle) * sq.dist,
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{ duration: 0.8, delay: sq.delay, ease: "easeOut", opacity: { times: [0, 0.1, 0.7, 1] } }}
                  style={{
                    position: "absolute",
                    left: `${sq.xPct}%`,
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
        </div>
      </div>
    </MotionLink>
  );
}