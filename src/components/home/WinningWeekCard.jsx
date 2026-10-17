import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

// The headline of the dashboard: are you winning this week? A prominent,
// supportive status, the win streak, and a mini zone-gauge showing where the
// running average sits relative to target ± zone.
export default function WinningWeekCard({ result }) {
  const cur = result?.current;
  const avg = cur?.avgCalories ?? null;
  const target = result?.target ?? 0;
  const zone = result?.zone ?? 0;
  const streak = result?.streak ?? 0;
  const hasWi = result?.hasWeighIns;

  const onTrack = avg !== null && Math.abs(avg - target) <= zone;
  const head = !hasWi
    ? "Scoreboard starts here"
    : avg === null
    ? "Logging this week"
    : onTrack
    ? "On track"
    : "Keep climbing";
  const sub = !hasWi
    ? "Log a week and step on the scale — your first winning week forms after two weigh-ins."
    : avg === null
    ? "Keep logging — your average takes shape as the week fills in."
    : onTrack
    ? "Your average is inside the zone. Hold this rhythm."
    : "You're close. A few on-target days pull the average right back.";

  const lo = target - zone * 2;
  const hi = target + zone * 2;
  const span = Math.max(1, hi - lo);
  const clampPct = (v) => Math.max(0, Math.min(100, ((v - lo) / span) * 100));
  const zoneLeft = clampPct(target - zone);
  const zoneWidth = Math.max(0, clampPct(target + zone) - zoneLeft);
  const avgPct = avg !== null ? clampPct(avg) : null;

  return (
    <Link
      to="/fuel"
      className={`group block rounded-2xl border p-5 transition-all hover:border-accent/40 ${
        onTrack ? "border-accent/30 bg-accent/[0.05] glow-sm" : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Winning Week</p>
        <span className="flex items-center gap-1.5">
          <Flame
            className={`h-3.5 w-3.5 ${streak > 0 ? "text-accent" : "text-foreground/25"}`}
            strokeWidth={1.75}
          />
          <span className={`font-mono text-sm ${streak > 0 ? "text-accent" : "text-foreground/40"}`}>
            {streak}
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p
            className={`font-display text-2xl font-light leading-tight ${
              onTrack ? "text-foreground text-glow" : "text-foreground/85"
            }`}
          >
            {head}
          </p>
          <p className="mt-1.5 max-w-[14rem] text-xs font-light leading-relaxed text-foreground/45">
            {sub}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg text-accent">{avg !== null ? avg.toLocaleString() : "—"}</p>
          <p className="text-[10px] font-light text-foreground/40">
            target {target.toLocaleString()} ±{zone}
          </p>
        </div>
      </div>

      <div className="relative mt-4 h-2 w-full rounded-full bg-white/[0.05]">
        <div
          className="absolute bottom-0 top-0 rounded-full bg-accent/25"
          style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
        />
        <div className="absolute bottom-0 top-0 w-px bg-accent/60" style={{ left: "50%" }} />
        {avgPct !== null && (
          <motion.div
            initial={{ left: "50%" }}
            animate={{ left: `${avgPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              onTrack ? "bg-accent glow-sm" : "bg-accent/70"
            }`}
          />
        )}
      </div>
    </Link>
  );
}