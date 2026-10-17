import React from "react";

export default function BigChoice({ label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
        selected
          ? "border-accent bg-accent/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
      }`}
    >
      <p className={`text-base ${selected ? "text-accent" : "text-foreground/85"}`}>{label}</p>
      {description && <p className="mt-1 text-xs font-light leading-relaxed text-foreground/40">{description}</p>}
    </button>
  );
}