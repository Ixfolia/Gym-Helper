import React from "react";
import StreakBadge from "@/components/streak/StreakBadge";
import { streakGlowColor } from "@/lib/streakTiers";

// Top-left tracking-streak badge for the Fuel page. The pixelated emoji is the
// dominant element (~60px, the largest streak emoji in the app), with the
// streak count tucked to its bottom-right at ~42% of the emoji size — the same
// big-to-small relationship as the Weekly Nutrition numbers and their
// parentheticals. A soft blue glow appears at 3+ days, and a "TRACKING STREAK"
// micro-label sits beneath. Reuses StreakBadge directly, so the tier/emoji
// logic (and one-time tier-up pop) is identical to everywhere else.
export default function FuelStreakBadge({ count = 0 }) {
  const c = Math.max(0, Math.floor(count || 0));
  if (c < 1) return null;
  const glow = c >= 3;
  const color = streakGlowColor(c);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-baseline">
        <StreakBadge
          count={c}
          size={72}
          slotKey="fuel-tracking"
          style={glow ? { filter: `drop-shadow(0 0 10px ${color}8C)` } : undefined}
        />
        <span
          className={`font-display font-bold leading-none ${glow ? "text-accent" : "text-foreground/70"}`}
          style={{ fontSize: "1.05rem", marginLeft: "-0.2rem" }}
        >
          {c}
        </span>
      </div>
      <p className="text-[8px] font-mono uppercase tracking-[0.28em] text-foreground/40">Tracking streak</p>
    </div>
  );
}