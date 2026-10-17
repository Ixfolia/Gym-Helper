import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import StreakBadge from "@/components/streak/StreakBadge";

// Compact habit row for the desktop right panel: today's check, name, flame
// streak, and a glowing weekly completion bar.
export default function HabitMiniRow({ name, doneToday, streak, pct }) {
  const v = Math.max(0, Math.min(100, Math.round(pct ?? 0)));
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          doneToday ? "border-accent bg-accent/15 glow-sm" : "border-white/15"
        }`}
      >
        {doneToday && <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-foreground/75">{name}</span>
          <div className="flex shrink-0 items-center gap-2">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 font-mono text-[11px] text-accent">
                <StreakBadge count={streak} slotKey={`habit:${name}`} size={14} />
                {streak}
              </span>
            )}
            <span className="font-mono text-[11px] text-foreground/50">{v}%</span>
          </div>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${v}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${v >= 50 ? "bg-accent glow-sm" : "bg-accent/45"}`}
          />
        </div>
      </div>
    </div>
  );
}