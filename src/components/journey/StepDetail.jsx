import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Star, Trophy, Lock, Sparkles } from "lucide-react";
import { stepMode, isStepDone } from "@/lib/journeyEngine";

function Section({ label, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">{label}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export default function StepDetail({ step, phaseName, phaseIndex, progress, evalMap, isCurrent, onClose, onConfirm }) {
  // Derive done/undo from the LIVE progress map + evalMap on every render — not
  // from a snapshot taken when the sheet opened — so the button flips to
  // "Marked complete" the instant the optimistic update lands, and back on undo.
  const done = isStepDone(step.id, progress, evalMap);
  const autoDone = !!evalMap[step.id]?.autoDone;
  const rule = stepMode(step.id);
  const isGate = rule.mode === "gate";
  // Manual steps always confirm. Flex steps confirm only while their signal is
  // unsatisfied — once real data completes a flex step it shows "completed
  // itself" and can't be undone (undo never un-completes real data).
  const showConfirm = rule.mode === "manual" || (rule.mode === "flex" && !autoDone);
  const autoCompleted = (rule.mode === "auto" || rule.mode === "flex") && autoDone;

  // Disable the button while a write is in flight to prevent double-taps.
  const [pending, setPending] = useState(false);
  async function handleConfirm() {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
        className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-card p-6 pb-8"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-accent/70">
              Phase {phaseIndex} · {phaseName}
            </p>
            <h2 className="mt-1.5 flex items-center gap-2 font-display text-xl font-light leading-tight tracking-tight text-foreground">
              {step.title}
              {step.gate && <Star className="h-4 w-4 text-accent" strokeWidth={1.5} />}
              {step.capstone && <Trophy className="h-4 w-4 text-accent" strokeWidth={1.5} />}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/40 transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {isCurrent && !isGate && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Current step
          </span>
        )}
        {isGate && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground/45">
            <Lock className="h-3 w-3" strokeWidth={1.75} />
            Locked — the Gate
          </span>
        )}

        <div className="mt-6 space-y-6">
          <Section label="What this step is">
            <p className="text-sm font-light leading-relaxed text-foreground/70">{step.description}</p>
          </Section>

          <Section label="Why it matters">
            <p className="text-sm font-light leading-relaxed text-foreground/70">{step.why}</p>
          </Section>

          <Section label="Done when">
            <ul className="space-y-2.5">
              {step.doneWhen.map((d, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/70" strokeWidth={2} />
                  <span className="text-sm font-light leading-relaxed text-foreground/65">{d}</span>
                </li>
              ))}
            </ul>
          </Section>

          {!isGate && (
            <Section label="How it completes">
              <p className="text-sm font-light leading-relaxed text-foreground/60">
                {rule.hint}
              </p>
            </Section>
          )}

          <Section label="Reflect">
            <ol className="space-y-2.5">
              {step.questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-[11px] text-foreground/30">{i + 1}</span>
                  <span className="text-sm font-light leading-relaxed text-foreground/65">{q}</span>
                </li>
              ))}
            </ol>
          </Section>

        </div>

        {isGate ? (
          <p className="mt-6 text-center text-xs font-light leading-relaxed text-foreground/40">
            The Gate is built separately and unlocks on its own. Nothing to do here yet.
          </p>
        ) : showConfirm ? (
          <div className="mt-6">
            <button
              onClick={handleConfirm}
              disabled={pending}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                done
                  ? "border border-accent/40 bg-accent/10 text-accent"
                  : "bg-accent text-primary-foreground glow-sm hover:glow-md"
              }`}
            >
              <Check className="h-4 w-4" strokeWidth={2} />
              {pending ? "Saving…" : done ? "Marked complete — tap to undo" : "I've done this"}
            </button>
            <p className="mt-2 text-center text-xs font-light text-foreground/40">This step is confirmed by you.</p>
          </div>
        ) : autoCompleted ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/[0.06] py-4 text-sm text-accent">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            Completed itself — keep climbing
          </div>
        ) : (
          <p className="mt-6 text-center text-xs font-light leading-relaxed text-foreground/40">
            This step completes on its own. Keep showing up — it'll mark itself done.
          </p>
        )}
      </motion.div>
    </div>
  );
}