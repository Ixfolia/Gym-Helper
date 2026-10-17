import React from "react";
import { motion } from "framer-motion";
import { Check, Lock, Crown } from "lucide-react";
import { stepMode } from "@/lib/journeyEngine";

// One node on the ascent: a glowing marker, a crown on the current step, and a
// live progress bar that fills as real data accumulates toward the step's
// done-when condition.
export default function AscentStep({ step, status, isCurrent, progress, onClick }) {
  const done = status === "done";
  const rule = stepMode(step.id);
  const isGate = rule.mode === "gate";

  const pct = done
    ? 100
    : progress && progress.kind === "count"
    ? Math.min(100, Math.round((progress.current / Math.max(1, progress.target)) * 100))
    : 0;

  const progressText = (() => {
    if (done) return "Complete";
    if (isGate) return "Locked — the Gate";
    if (progress && progress.kind === "count")
      return `${Math.min(progress.current, progress.target)}/${progress.target} ${progress.label}`;
    if (progress && progress.kind === "confirm") return "Coach-guided · tap to confirm";
    return "";
  })();

  const lit = done || isCurrent;

  return (
    <button onClick={onClick} className="relative flex w-full items-start gap-4 py-3 text-left">
      {/* crown sits atop the current step */}
      {isCurrent && !isGate && (
        <motion.span
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="absolute -top-2 left-[10px] z-20"
        >
          <Crown className="h-4 w-4 text-accent" strokeWidth={1.75} />
        </motion.span>
      )}

      <span
        className={`relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
          done
            ? "border-accent bg-accent text-primary-foreground glow-md"
            : isCurrent && !isGate
            ? "border-accent bg-accent/10 glow-sm"
            : isGate
            ? "border-white/15 bg-background"
            : "border-white/12 bg-background"
        }`}
      >
        {done ? (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        ) : isGate ? (
          <Lock className="h-3.5 w-3.5 text-foreground/40" strokeWidth={1.75} />
        ) : isCurrent ? (
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-2 rounded-full bg-accent"
          />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        )}
      </span>

      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <p
            className={`line-clamp-2 break-words leading-snug text-sm ${
              done ? "text-foreground/90" : isCurrent ? "text-foreground" : "text-foreground/60"
            }`}
          >
            {step.title}
          </p>
          {step.capstone && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-accent/60">Capstone</span>
          )}
        </div>

        {isGate ? (
          <p className="mt-1 text-[11px] font-light text-foreground/40">{progressText}</p>
        ) : (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  lit ? "bg-accent glow-sm" : "bg-accent/45"
                }`}
              />
            </div>
            <p
              className={`mt-1.5 font-mono text-[11px] ${
                lit ? "text-accent/80" : "text-foreground/40"
              }`}
            >
              {progressText}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}