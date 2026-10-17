import React from "react";
import { Link } from "react-router-dom";

// Supportive, zero-shame nudge shown when a member's goal outruns what the
// max healthy pace can deliver in 6 months. Dismissible; re-arms on goal change.
export default function RecalibrateCard({ onKeep }) {
  return (
    <div className="rounded-xl border border-accent/50 bg-card p-4">
      <p className="font-display text-sm font-semibold text-accent">Recalibrate the timeline.</p>
      <p className="mt-2 text-[11px] font-light leading-relaxed text-foreground/65">
        {"Your goal outruns what a healthy pace delivers in 6 months. Fast fades — sustainable lasts. Extend the timeline or adjust the goal; either way, you're building for keeps."}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          to="/fuel/goal"
          className="rounded-lg bg-accent px-3 py-2 text-[11px] font-medium text-primary-foreground glow-sm"
        >
          Adjust goal
        </Link>
        <button
          onClick={onKeep}
          className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-medium text-foreground/70 transition-colors hover:border-accent/40"
        >
          Keep my goal
        </button>
      </div>
    </div>
  );
}