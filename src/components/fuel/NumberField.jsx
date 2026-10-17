import React from "react";

export default function NumberField({ label, value, onChange, unit, placeholder, autoFocus, inputRef }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">{label}</span>
      <div className="mt-2 flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 transition-colors focus-within:border-accent/50">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="w-full bg-transparent py-4 text-2xl font-light text-foreground outline-none placeholder:text-foreground/20"
        />
        {unit && <span className="ml-2 shrink-0 text-sm font-light text-foreground/40">{unit}</span>}
      </div>
    </label>
  );
}