import React from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

export default function WinningWeekStrip({ result }) {
  const cur = result?.current;
  const status = cur
    ? cur.avgCalories !== null
      ? `${cur.avgCalories.toLocaleString()} avg · target ${result.target.toLocaleString()} ±${result.zone}`
      : `Target ${result.target.toLocaleString()} ±${result.zone}`
    : "First week forms after your second weigh-in";
  return (
    <Link
      to="/fuel"
      className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-accent/30"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Winning week</p>
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          <span className="font-mono text-sm text-accent">{result?.streak ?? 0}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-light text-foreground/70">{cur ? "This week · in progress" : "—"}</p>
      <p className="mt-0.5 text-xs font-light leading-relaxed text-foreground/45">{status}</p>
    </Link>
  );
}