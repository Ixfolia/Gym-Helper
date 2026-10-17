import React from "react";

function Metric({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-mono text-xl font-light text-foreground/80">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-foreground/40">{label}</p>
    </div>
  );
}

export default function ConsistencyRow({ trackedPct, habitPct, workoutPct }) {
  const fmt = (v) => (v === null || v === undefined ? "—" : `${Math.round(v)}%`);
  return (
    <div className="flex items-stretch rounded-2xl border border-white/[0.06] bg-white/[0.02] py-4">
      <Metric label="Days tracked" value={fmt(trackedPct)} />
      <div className="w-px bg-white/[0.06]" />
      <Metric label="Habits" value={fmt(habitPct)} />
      <div className="w-px bg-white/[0.06]" />
      <Metric label="Workouts" value={fmt(workoutPct)} />
    </div>
  );
}