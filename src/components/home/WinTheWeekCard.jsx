import React from "react";
import { motion } from "framer-motion";
import { Dumbbell, ChefHat, Target } from "lucide-react";
import StreakBadge from "@/components/streak/StreakBadge";

// "Win the Week" scoreboard. Reuses the exact weekly percentages already
// computed for the old "This Week" card (workout / nutrition-tracked / habit)
// and the winning-week win streak — no new math or data here. The hero number
// is the average of the three percentages; each section shows its existing
// percentage with a glowing electric-blue fill bar that animates on change.
export default function WinTheWeekCard({ workoutPct, nutritionPct, habitPct, streak = 0 }) {
  const vals = [workoutPct, nutritionPct, habitPct].map((v) =>
    Math.max(0, Math.min(100, Math.round(v ?? 0)))
  );
  const score = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  // A brand-new week with nothing logged yet (no tracked day, no completed
  // session, no habit checked) reads as all-zero percentages. Show "New week"
  // in place of the big 0% and quiet em-dashes for each pillar; the moment any
  // entry of any kind lands, the percentages return.
  const emptyWeek = vals[0] === 0 && vals[1] === 0 && vals[2] === 0;

  const sections = [
    { label: "Workouts", icon: Dumbbell, pct: vals[0] },
    { label: "Nutrition", icon: ChefHat, pct: vals[1] },
    { label: "Habits", icon: Target, pct: vals[2] },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Win the Week</p>
        <span className="flex items-center gap-1.5">
          <StreakBadge count={streak} slotKey="week-score" size={16} className={streak > 0 ? "" : "opacity-40"} />
          <span className={`font-mono text-sm ${streak > 0 ? "text-accent" : "text-foreground/40"}`}>
            {streak}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <motion.p
          key={emptyWeek ? "new-week" : score}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="font-display text-[3.3rem] font-bold leading-none text-accent text-glow"
        >
          {emptyWeek ? "New week" : (<>{score}<span className="text-2xl">%</span></>)}
        </motion.p>
        <p className="mb-1 text-xs font-light text-foreground/45">Week score</p>
      </div>

      <div className="mt-5 space-y-3.5">
        {sections.map((s) => {
          const Icon = s.icon;
          const lit = s.pct >= 50;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-foreground/65">
                  <Icon className="h-3.5 w-3.5 text-foreground/55" strokeWidth={1.75} />
                  {s.label}
                </span>
                <span className="font-mono text-xs text-foreground/70">{emptyWeek ? "—" : `${s.pct}%`}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={`h-full rounded-full ${lit ? "bg-accent glow-sm" : "bg-accent/45"}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}