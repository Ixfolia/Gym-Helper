import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/api/db";
import { computeWinningWeeks } from "@/lib/winningWeek";
import { withRetry } from "@/lib/retry";
import { dedupeByWeekStart } from "@/lib/dedupe";
import { createWeekSummaryIfAbsent } from "@/lib/weeklySummarySync";
import { Check, X } from "lucide-react";
import StreakBadge from "@/components/streak/StreakBadge";

const SHOWUP_KEY = "peak_showup_dismissed";

function Pillar({ won, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          won ? "bg-accent text-primary-foreground" : "border border-white/12 text-foreground/35"
        }`}
      >
        {won ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={2.5} />}
      </span>
      <span className={`text-[11px] ${won ? "text-foreground/80" : "text-foreground/45"}`}>{label}</span>
    </div>
  );
}

function WeekRow({ period, inProgress }) {
  const won = period.won;
  return (
    <div
      className={`rounded-2xl border p-4 ${
        inProgress
          ? "border-white/[0.08] bg-white/[0.02]"
          : period.warmup
          ? "border-white/[0.05] bg-white/[0.015]"
          : won
          ? "border-accent/30 bg-accent/[0.04] glow-sm"
          : "border-white/[0.06] bg-white/[0.015]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-light text-foreground/55">{period.label}</span>
        {period.warmup ? (
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-foreground/45">
            Warm-up
          </span>
        ) : inProgress ? (
          <span className="text-[9px] uppercase tracking-[0.2em] text-foreground/40">In progress</span>
        ) : won ? (
          <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/[0.08] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-accent">
            <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> Won
          </span>
        ) : (
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-foreground/40">
            Logged
          </span>
        )}
      </div>

      {period.warmup ? (
        <p className="mt-2 text-xs font-light leading-relaxed text-foreground/45">
          A partial first week — showing up. This one's never graded.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Pillar won={period.nutrition_won} label="Nutrition" />
            <Pillar won={period.workouts_won} label="Workouts" />
            {period.habits_applicable !== false && <Pillar won={period.habits_won} label="Habits" />}
          </div>
          <p className="mt-2.5 text-[11px] font-light text-foreground/45">
            {period.avgCalories !== null
              ? `${period.avgCalories.toLocaleString()} avg cal · ${period.avgProtein ?? 0} g protein · ${period.tracked} days`
              : "No calorie logs this week."}
          </p>
        </>
      )}
    </div>
  );
}

export default function WinningWeek({ refreshKey }) {
  const [data, setData] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [err, setErr] = useState(false);
  const [showupDismissed, setShowupDismissed] = useState(false);
  const persistedRef = useRef(new Set());

  useEffect(() => {
    try {
      setShowupDismissed(localStorage.getItem(SHOWUP_KEY) === "1");
    } catch (e) {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setErr(false);
    try {
      const [profiles, logs, weighIns, habitLogs, workoutLogs, history, sessionCompletions, weeklySummaries, journeyProgress] =
        await Promise.all([
          withRetry(() => db.entities.Profile.list()),
          withRetry(() => db.entities.DailyLog.list("-date", 400)),
          withRetry(() => db.entities.WeighIn.list("-date", 100)),
          withRetry(() => db.entities.HabitLog.list("-date", 600)),
          withRetry(() => db.entities.WorkoutLog.list("-date", 200)),
          withRetry(() => db.entities.MaintenanceHistory.list("-date", 50)),
          withRetry(() => db.entities.SessionCompletion.list("-date", 200)),
          withRetry(() => db.entities.WeeklySummary.list("-date", 200)),
          withRetry(() => db.entities.JourneyProgress.list("-date", 200)),
        ]);
      setData({
        profile: profiles[0] || null,
        logs,
        weighIns,
        habitLogs,
        workoutLogs,
        history,
        sessionCompletions,
        journeyProgress,
      });
      const dedupedSummaries = dedupeByWeekStart(weeklySummaries || []);
      setSummaries(dedupedSummaries);
      persistedRef.current = new Set(dedupedSummaries.map((r) => r.week_start));
    } catch (e) {
      setErr(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const result = useMemo(() => {
    if (!data?.profile) return null;
    return computeWinningWeeks(
      data.profile,
      data.logs,
      data.weighIns,
      data.habitLogs,
      data.workoutLogs,
      data.history,
      data.sessionCompletions,
      summaries,
      data.journeyProgress
    );
  }, [data, summaries]);

  // Grade once, keep forever — but provisional weeks (ended within ~48h) are
  // regraded and overwritten on load. Creates re-fetch the week right before
  // writing and abort if a summary already exists, so a concurrent load can
  // never duplicate a week_start.
  useEffect(() => {
    if (!result) return;
    const existingByStart = {};
    for (const r of summaries) if (r && r.week_start) existingByStart[r.week_start] = r;

    const toCreate = result.periods.filter(
      (p) => !p.warmup && !p.persisted && !p.provisional && !persistedRef.current.has(p.week_start)
    );
    const toUpdate = result.periods.filter(
      (p) => !p.warmup && p.provisional && existingByStart[p.week_start]
    );
    if (!toCreate.length && !toUpdate.length) return;
    let cancelled = false;
    (async () => {
      const created = [];
      for (const p of toCreate) {
        if (persistedRef.current.has(p.week_start)) continue;
        persistedRef.current.add(p.week_start);
        try {
          const row = await createWeekSummaryIfAbsent({
            week_start: p.week_start,
            stage: p.stage,
            warmup: false,
            nutrition_won: !!p.nutrition_won,
            workouts_won: !!p.workouts_won,
            habits_won: !!p.habits_won,
            won: !!p.won,
            avg_calories: p.avgCalories,
            avg_protein: p.avgProtein,
            tracked_days: p.tracked,
          });
          if (row) created.push(row);
        } catch (e) {
          persistedRef.current.delete(p.week_start);
        }
      }
      const updated = [];
      for (const p of toUpdate) {
        const ex = existingByStart[p.week_start];
        if (!ex) continue;
        const next = {
          stage: p.stage,
          nutrition_won: !!p.nutrition_won,
          workouts_won: !!p.workouts_won,
          habits_won: !!p.habits_won,
          won: !!p.won,
          avg_calories: p.avgCalories,
          avg_protein: p.avgProtein,
          tracked_days: p.tracked,
        };
        const changed =
          ex.stage !== next.stage ||
          !!ex.nutrition_won !== next.nutrition_won ||
          !!ex.workouts_won !== next.workouts_won ||
          !!ex.habits_won !== next.habits_won ||
          !!ex.won !== next.won ||
          (ex.avg_calories ?? null) !== (next.avg_calories ?? null) ||
          (ex.avg_protein ?? null) !== (next.avg_protein ?? null) ||
          (ex.tracked_days ?? null) !== (next.tracked_days ?? null);
        if (!changed) continue;
        try {
          const row = await db.entities.WeeklySummary.update(ex.id, next);
          updated.push(row);
        } catch (e) {
          /* leave the stale row; next load retries */
        }
      }
      if (!cancelled && (created.length || updated.length)) {
        setSummaries((prev) => {
          const map = {};
          for (const r of dedupeByWeekStart(prev)) map[r.week_start] = r;
          for (const r of created) map[r.week_start] = r;
          for (const r of updated) map[r.week_start] = r;
          return Object.values(map);
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result, summaries]);

  function dismissShowup() {
    setShowupDismissed(true);
    try {
      localStorage.setItem(SHOWUP_KEY, "1");
    } catch (e) {
      /* ignore */
    }
  }

  if (err) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm font-light text-foreground/50">Couldn't load the Winning Week.</p>
        <button
          onClick={load}
          className="rounded-xl border border-accent/30 bg-accent/[0.06] px-4 py-2 text-xs text-accent transition-all hover:bg-accent/[0.1]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !result) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const gradedCount = result.periods.filter((p) => !p.warmup).length;
  const reversed = [...result.periods].reverse();

  return (
    <div className="mt-12">
      <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">The Winning Week</p>

      <div className="mt-4 flex items-center gap-3">
        {/* WIN STREAK tile — nutrition streak */}
        <div className="flex items-center gap-2 rounded-2xl border border-accent/25 bg-accent/[0.05] px-4 py-3">
          <StreakBadge count={result.nutritionStreak} slotKey="win-streak" size={18} />
          <div>
            <p className="font-mono text-lg font-light leading-none text-accent text-glow">
              {result.nutritionStreak}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-foreground/45">win streak</p>
          </div>
        </div>
        {/* graded weeks count */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <p className="font-mono text-lg font-light leading-none text-foreground/80">{gradedCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-foreground/45">graded</p>
        </div>
        {/* live stage rule tile (replaces TARGET ±100) */}
        <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <p className="truncate font-mono text-xs font-light leading-none text-foreground/75">
            {result.current?.ruleText || "—"}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-foreground/45">this week's rule</p>
        </div>
      </div>

      {result.current?.travelWeek && (
        <div className="mt-3">
          <span className="rounded-full border border-accent/30 bg-accent/[0.08] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-accent">
            Travel week — graded vs adjusted goals
          </span>
        </div>
      )}

      {result.showUpEnded && !showupDismissed && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/[0.05] p-4">
          <p className="text-sm font-light leading-relaxed text-foreground/70">
            Two weeks of showing up. You've got the data — now we pick up the pace.
          </p>
          <button
            onClick={dismissShowup}
            className="shrink-0 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
          >
            Dismiss
          </button>
        </div>
      )}

      {!result.hasWeighIns ? (
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
          <p className="text-sm font-light leading-relaxed text-foreground/55">
            Log a day of fuel and your Winning Week scoreboard begins — calendar weeks, Monday to Sunday.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {result.current && <WeekRow period={result.current} inProgress />}
          {reversed.map((p, i) => (
            <WeekRow key={p.week_start || i} period={p} />
          ))}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] font-light leading-relaxed text-foreground/35">
        A tracked week is never a failed week — it's data that sharpens your next refinement.
      </p>
    </div>
  );
}