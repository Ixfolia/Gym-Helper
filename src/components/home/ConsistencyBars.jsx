import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function ConsistencyBars({
  trackedPct,
  habitPct,
  workoutPct,
  trackingStreak,
  habitStreak,
}) {
  const rows = [
    { label: "Days tracked", pct: trackedPct, streak: trackingStreak },
    { label: "Habits", pct: habitPct, streak: habitStreak },
    { label: "Workouts", pct: workoutPct, streak: null },
  ];

  return (
    <div className="space-y-3.5">
      {rows.map((r) => {
        const v = Math.max(0, Math.min(100, Math.round(r.pct ?? 0)));
        const lit = v >= 50;
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/65">{r.label}</span>
                {r.streak != null && r.streak > 0 && (
                  <span className="flex items-center gap-0.5 font-mono text-[11px] text-accent">
                    <Flame className="h-3 w-3" strokeWidth={1.75} />
                    {r.streak}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-foreground/70">{v}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${v}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-full ${lit ? "bg-accent glow-sm" : "bg-accent/45"}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}