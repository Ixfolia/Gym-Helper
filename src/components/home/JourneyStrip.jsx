import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function JourneyStrip({ phase, step }) {
  return (
    <Link
      to="/journey"
      className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-accent/30"
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Journey</p>
        <p className="mt-2 truncate text-sm font-light text-foreground/70">{phase || "Not started"}</p>
        <p className="mt-0.5 truncate text-xs font-light text-foreground/45">{step || "Tap to begin"}</p>
      </div>
      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-foreground/30 transition-colors group-hover:text-accent"
        strokeWidth={1.5}
      />
    </Link>
  );
}