import React from "react";

export default function ConfidenceMeter({ level, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-2 w-2 rounded-full transition-all ${
              n <= level ? "bg-accent glow-sm" : "bg-white/15"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-[11px] uppercase tracking-[0.24em] ${
          level >= 3 ? "text-accent" : "text-foreground/55"
        }`}
      >
        {label}
      </p>
    </div>
  );
}