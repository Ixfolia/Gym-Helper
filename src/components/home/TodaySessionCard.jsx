import React from "react";
import { Link } from "react-router-dom";
import { Check, ArrowUpRight } from "lucide-react";
import { getToday, defaultSchedule } from "@/lib/splits";
import { buildTravelDay } from "@/lib/travelProtocol";

// Home "Today's session" card. Shows today's scheduled session title (respecting
// travel mode) with a glowing completed badge when a SessionCompletion record
// exists for today. Taps to the Train screen. Presentation only.
export default function TodaySessionCard({ profile, completion }) {
  if (!profile) return null;
  const schedule =
    profile.week_schedule && profile.week_schedule.length === 7
      ? profile.week_schedule
      : defaultSchedule(profile.cadence);
  const { weekday, day: scheduledDay } = getToday(profile.cadence, schedule);
  const travelDay = profile.travel_mode ? buildTravelDay(profile, false) : null;
  const day = travelDay || scheduledDay;
  const title = day?.title || "Today's session";
  const completed = !!completion;

  return (
    <Link
      to="/train"
      className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-accent/30"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Today's session</p>
        <span className="text-[10px] font-light text-foreground/30">{weekday}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-lg font-light leading-tight text-foreground">{title}</p>
        {completed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent/[0.06] px-2.5 py-1 font-mono text-[11px] text-accent glow-sm">
            <Check className="h-3 w-3" strokeWidth={2} /> Done
          </span>
        ) : (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/30" strokeWidth={1.5} />
        )}
      </div>
    </Link>
  );
}