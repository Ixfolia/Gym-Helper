import React from "react";
import HabitHeatmap from "@/components/habits/HabitHeatmap";
import HabitIcon from "@/components/habits/HabitIcon";
import StreakBadge from "@/components/streak/StreakBadge";

// One habit's master-view section: its heatmap grid, its streak chip, and its
// completion percentage since the habit's creation. Reuses the same HabitHeatmap
// + StreakBadge the Habits page renders.
export default function HabitSection({ name, index, columns, streak, sincePct }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm text-foreground/80">
          <HabitIcon index={index} size={18} />
          <span className="truncate">{name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] text-foreground/55">{sincePct}%</span>
          <span
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] ${
              streak > 0
                ? "border-accent/30 bg-accent/[0.06] text-accent"
                : "border-white/10 text-foreground/40"
            }`}
          >
            <StreakBadge
              count={streak}
              slotKey={`home-habit:${name}`}
              size={14}
              className={streak > 0 ? "" : "opacity-40"}
            />
            {streak}
          </span>
        </span>
      </div>
      <div className="mt-3">
        <HabitHeatmap columns={columns} />
      </div>
    </div>
  );
}