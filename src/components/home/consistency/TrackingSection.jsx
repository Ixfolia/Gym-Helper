import React from "react";
import HabitHeatmap from "@/components/habits/HabitHeatmap";
import StreakBadge from "@/components/streak/StreakBadge";

// The Tracking section of the Consistency master view: a heatmap of tracked
// fuel days (calories logged, voided excluded) with the tracking streak and its
// 30-day percentage. Reuses the same HabitHeatmap grid shape.
export default function TrackingSection({ columns, streak, pct30 }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-foreground/80">Tracking</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] text-foreground/55">{pct30}%</span>
          <span
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] ${
              streak > 0
                ? "border-accent/30 bg-accent/[0.06] text-accent"
                : "border-white/10 text-foreground/40"
            }`}
          >
            <StreakBadge
              count={streak}
              slotKey="home-tracking"
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