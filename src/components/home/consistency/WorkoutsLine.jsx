import React from "react";

// Compact Workouts line for the Consistency master view: sessions completed vs
// scheduled over the trailing 30 days as a percentage.
export default function WorkoutsLine({ completed, scheduled, pct }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">Workouts</span>
        <span className="font-mono text-xs text-foreground/55">
          {completed}/{scheduled} <span className="text-accent">{pct}%</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-accent/70 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}