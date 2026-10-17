import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import ConsistencyMasterOverlay from "@/components/home/consistency/ConsistencyMasterOverlay";
import { format, subDays, addDays } from "date-fns";
import { buildConsistencyHeatmap } from "@/lib/consistencyHeatmap";
import { buildHeatmap } from "@/lib/habitHeatmap";
import { completedSessions } from "@/lib/sessionCompletion";
import { currentWeekRange, habitWeeklyStats, trackingStreak } from "@/lib/weekScore";
import { windowStats } from "@/lib/consistencyRead";
import HabitSection from "@/components/home/consistency/HabitSection";
import TrackingSection from "@/components/home/consistency/TrackingSection";
import WorkoutsLine from "@/components/home/consistency/WorkoutsLine";
import CoachRead from "@/components/home/consistency/CoachRead";

const ROW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function trackedDateSet(dailyLogs) {
  return new Set(
    (dailyLogs || [])
      .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0 && !l.voided)
      .map((l) => l.date)
  );
}

// Sessions completed vs scheduled over the trailing 30 days. Scheduled comes
// from week_schedule non-rest days (cadence fallback: 4 on 4–6, 3 on 3–5).
function workouts30(workoutLogs, sessionCompletions, profile, today = new Date()) {
  const sessions = completedSessions(workoutLogs, sessionCompletions);
  const todayStr = format(today, "yyyy-MM-dd");
  const winStartStr = format(subDays(today, 29), "yyyy-MM-dd");
  const schedule =
    profile?.week_schedule && profile.week_schedule.length === 7 ? profile.week_schedule : null;
  const perWeek = profile?.cadence === "4-6" ? 4 : 3;
  let scheduled = 0;
  let completed = 0;
  let d = new Date(winStartStr + "T12:00:00");
  while (format(d, "yyyy-MM-dd") <= todayStr) {
    const ds = format(d, "yyyy-MM-dd");
    const dow = (d.getDay() + 6) % 7;
    if (schedule) {
      if (schedule[dow] !== "rest") scheduled++;
    } else {
      scheduled += perWeek / 7;
    }
    if (sessions.some((s) => s.date === ds)) completed++;
    d = addDays(d, 1);
  }
  if (!schedule) scheduled = Math.round(scheduled);
  const pct = scheduled > 0 ? Math.min(100, Math.round((completed / scheduled) * 100)) : 0;
  return { completed, scheduled, pct, dataDays: 30 };
}

export default function ConsistencyCard({
  dailyLogs,
  habitLogs,
  workoutLogs,
  habits,
  profile,
  sessionCompletions,
  weeks = 11,
}) {
  const [open, setOpen] = useState(false);

  const collapsed = useMemo(
    () => buildConsistencyHeatmap({ workoutLogs, dailyLogs, habitLogs, habits, weeks }),
    [workoutLogs, dailyLogs, habitLogs, habits, weeks]
  );

  const master = useMemo(() => {
    const today = new Date();
    const names = (habits || []).filter((h) => h && String(h).trim());
    const week = currentWeekRange(profile);

    const habitSections = names.map((name, i) => {
      const doneDates = new Set(
        (habitLogs || [])
          .filter((l) => l.habit_name === name && l.done && l.date)
          .map((l) => l.date)
      );
      const habitDates = (habitLogs || [])
        .filter((l) => l.habit_name === name && l.date)
        .map((l) => l.date)
        .sort();
      const createdDate = habitDates.length ? habitDates[0] : null;
      const hm = buildHeatmap(doneDates, 15, today, createdDate);
      const stats = habitWeeklyStats(name, habitLogs, week);
      const w = windowStats(doneDates, createdDate, today);
      return {
        name,
        index: i,
        columns: hm.columns,
        sincePct: hm.stat.pct,
        streak: stats.streak,
        pct30: w.pct,
        dataDays: w.dataDays,
      };
    });

    const tSet = trackedDateSet(dailyLogs);
    const tDatesArr = [...tSet].sort();
    const firstTracked = tDatesArr.length ? tDatesArr[0] : null;
    const tHm = buildHeatmap(tSet, 15, today, null);
    const tStreak = trackingStreak(dailyLogs);
    const tWin = windowStats(tSet, firstTracked, today);

    const w30 = workouts30(workoutLogs, sessionCompletions, profile, today);

    const tiles = [
      ...habitSections.map((h) => ({
        key: `habit:${h.name}`,
        label: h.name,
        pct: h.pct30,
        dataDays: h.dataDays,
      })),
      { key: "tracking", label: "Tracking", pct: tWin.pct, dataDays: tWin.dataDays },
      { key: "workouts", label: "Workouts", pct: w30.pct, dataDays: w30.dataDays },
    ];

    return {
      habitSections,
      tracking: { columns: tHm.columns, streak: tStreak, pct30: tWin.pct },
      workouts: w30,
      tiles,
    };
  }, [dailyLogs, habitLogs, workoutLogs, habits, profile, sessionCompletions]);

  return (
    <>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-accent/30">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between"
          aria-expanded={open}
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Consistency</p>
          <ChevronDown
            className={`h-4 w-4 text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.5}
          />
        </button>

        <div className="mt-4 flex gap-1.5">
          <div className="flex flex-col gap-[3px]">
            {ROW_LABELS.map((l, i) => (
              <span
                key={i}
                className="flex h-2.5 w-2.5 items-center justify-center text-[7px] font-light leading-none text-foreground/25"
              >
                {l}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px] overflow-x-auto pb-1">
            {collapsed.columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell, ri) => (
                  <span
                    key={ri}
                    className={`h-2.5 w-2.5 shrink-0 rounded-[3px] transition-colors ${
                      cell.future
                        ? "bg-white/[0.02]"
                        : cell.level === 2
                        ? "bg-accent glow-sm"
                        : cell.level === 1
                        ? "bg-accent/45"
                        : "bg-white/[0.07]"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-end gap-1 text-[8px] font-light text-foreground/30">
          <span>Less</span>
          <span className="h-2 w-2 rounded-[2px] bg-white/[0.07]" />
          <span className="h-2 w-2 rounded-[2px] bg-accent/45" />
          <span className="h-2 w-2 rounded-[2px] bg-accent glow-sm" />
          <span>More</span>
        </div>
      </div>

      <ConsistencyMasterOverlay open={open} onClose={() => setOpen(false)}>
        {master.habitSections.map((h) => (
          <HabitSection
            key={h.name}
            name={h.name}
            index={h.index}
            columns={h.columns}
            streak={h.streak}
            sincePct={h.sincePct}
          />
        ))}
        <TrackingSection
          columns={master.tracking.columns}
          streak={master.tracking.streak}
          pct30={master.tracking.pct30}
        />
        <WorkoutsLine
          completed={master.workouts.completed}
          scheduled={master.workouts.scheduled}
          pct={master.workouts.pct}
        />
        <div className="pt-1">
          <CoachRead tiles={master.tiles} />
        </div>
        <Link
          to="/habits"
          className="flex items-center justify-center gap-1 pt-1 text-[11px] font-light text-foreground/45 transition-colors hover:text-accent"
        >
          Open Habits <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
        </Link>
      </ConsistencyMasterOverlay>
    </>
  );
}