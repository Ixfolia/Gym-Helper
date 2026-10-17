import React from "react";

export default function PlaceholderHero({ label, note }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-white/[0.06] bg-white/[0.02] px-8 py-16 text-center">
      <div className="mb-6 h-2 w-2 rounded-full bg-accent glow-sm" />
      <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">{label}</p>
      <p className="mt-5 max-w-[16rem] text-sm font-light leading-relaxed text-foreground/50">{note}</p>
    </div>
  );
}