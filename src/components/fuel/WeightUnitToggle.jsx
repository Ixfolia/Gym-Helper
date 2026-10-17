import React from "react";

// Small "lbs | kg" toggle chip for weight chart cards. Reads/writes the global
// weight display preference via the parent (which uses useWeightUnit).
export default function WeightUnitToggle({ unit, onChange }) {
  return (
    <div className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] p-0.5">
      {["lbs", "kg"].map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
            unit === u
              ? "bg-accent/15 text-accent"
              : "text-foreground/45 hover:text-foreground/70"
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}