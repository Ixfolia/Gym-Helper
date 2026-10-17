import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// One-time-per-phase unlock dialog. The parent opens it the moment a phase
// completes and persists last_celebrated_phase so it never repeats. Title names
// the next phase just unlocked; body honors the just-finished phase.
export default function PhaseUnlockDialog({ completedPhase, nextPhaseNumber, nextPhaseName, open, onDismiss }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <DialogContent className="w-[320px] max-w-[calc(100vw-2rem)] gap-3 border-accent/30 bg-card p-6 text-center">
        <DialogHeader className="items-center text-center sm:text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-accent">Phase unlocked</p>
          <DialogTitle className="font-display text-[1.1rem] font-light leading-snug tracking-tight text-foreground text-glow">
            {nextPhaseNumber} · {nextPhaseName} unlocked.
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-[0.85rem] font-light leading-relaxed text-foreground/60">
          Phase {completedPhase} is done. Everything you built here carries up the mountain.
        </DialogDescription>
        <button
          onClick={onDismiss}
          className="mt-1 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-primary-foreground glow-sm transition-all hover:glow-md"
        >
          Let&apos;s climb
        </button>
      </DialogContent>
    </Dialog>
  );
}