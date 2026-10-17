import React from "react";

// Height entry as two compact numeric inputs (feet + inches). The label and
// styling mirror NumberField so it sits cleanly inside the onboarding wizard.
export default function HeightField({ ft, inches, onChange }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Height</span>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 transition-colors focus-within:border-accent/50">
          <input
            type="number"
            inputMode="numeric"
            value={ft ?? ""}
            placeholder="—"
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value), inches)}
            className="w-full bg-transparent py-4 text-2xl font-light text-foreground outline-none placeholder:text-foreground/20"
          />
          <span className="ml-2 shrink-0 text-sm font-light text-foreground/40">ft</span>
        </div>
        <div className="flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 transition-colors focus-within:border-accent/50">
          <input
            type="number"
            inputMode="numeric"
            value={inches ?? ""}
            placeholder="—"
            onChange={(e) => onChange(ft, e.target.value === "" ? null : Number(e.target.value))}
            className="w-full bg-transparent py-4 text-2xl font-light text-foreground outline-none placeholder:text-foreground/20"
          />
          <span className="ml-2 shrink-0 text-sm font-light text-foreground/40">in</span>
        </div>
      </div>
    </label>
  );
}