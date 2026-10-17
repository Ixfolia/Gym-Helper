import React from "react";
import { format, parseISO } from "date-fns";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";

// One-weigh-in baseline acknowledgment shown in place of the weight-trend empty
// state: the logged value in the card's number styling, a BASELINE micro-label,
// the log date, and one quiet line — "Your trend starts with your next weigh-in."
export default function WeightBaselineAck({ weightKg, dateStr, unit, className = "" }) {
  const lbl = unitLabel(unit);
  const w = kgToUnit(weightKg, unit);
  const d = dateStr ? format(parseISO(dateStr), "MMM d, yyyy") : "";
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Baseline</p>
      <p className="mt-1 font-mono text-2xl font-light text-foreground">
        {w} <span className="text-sm text-foreground/40">{lbl}</span>
      </p>
      {d && <p className="mt-1 text-[11px] font-light text-foreground/40">{d}</p>}
      <p className="mt-3 text-xs font-light text-foreground/30">Your trend starts with your next weigh-in.</p>
    </div>
  );
}