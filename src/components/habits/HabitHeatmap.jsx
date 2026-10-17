import React from "react";

// GitHub-contribution style consistency grid for a single habit. 7 rows
// (day of week, labeled S M T W T F S) × ~15 week columns. Cells are dim navy
// when nothing was done (or in the future) and glowing electric blue when the
// habit was completed — never red, never marks failure.
const ROW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitHeatmap({ columns }) {
  return (
    <div>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-[3px]">
          {ROW_LABELS.map((l, i) => (
            <span
              key={i}
              className="flex h-2.5 w-2.5 items-center justify-center text-[7px] font-light leading-none text-foreground/30"
            >
              {l}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell, ri) => (
                <span
                  key={ri}
                  title={`${cell.date}${cell.done ? " · done" : ""}`}
                  className={`h-2.5 w-2.5 shrink-0 rounded-[3px] transition-colors ${
                    cell.future
                      ? "bg-white/[0.02]"
                      : cell.done
                      ? "bg-accent glow-sm"
                      : "bg-white/[0.08]"
                  }`}
                  style={cell.before ? { opacity: 0.15 } : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[8px] font-light text-foreground/30">
        <span>Less</span>
        <span className="h-2 w-2 rounded-[2px] bg-white/[0.08]" />
        <span className="h-2 w-2 rounded-[2px] bg-accent/50" />
        <span className="h-2 w-2 rounded-[2px] bg-accent glow-sm" />
        <span>More</span>
      </div>
    </div>
  );
}