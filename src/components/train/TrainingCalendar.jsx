import React, { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { db } from "@/api/db";
import { getDays, getDayByKey, WEEKDAYS } from "@/lib/splits";
import { completedSessions } from "@/lib/sessionCompletion";
import { deleteWeekSummaryForDate } from "@/lib/weeklySummarySync";

// Month calendar of logged sessions. Tapping any day up to today opens a panel
// to set (or change, or clear) which split day was done on that date, so a
// session that was never logged on the day can be backfilled. Each date holds
// at most one SessionCompletion, matching the one-per-day Complete Session bar.
export default function TrainingCalendar({ profile, schedule, journeyPhase, todayCompletion, onTodayChange }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [completions, setCompletions] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  // Reload whenever today's completion changes from the Complete Session bar.
  const todayKey = todayCompletion ? `${todayCompletion.id}:${todayCompletion.session_name}` : "none";
  useEffect(() => {
    Promise.all([db.entities.SessionCompletion.list(), db.entities.WorkoutLog.list()]).then(([comps, logs]) => {
      setCompletions(comps);
      setWorkoutLogs(logs);
    });
  }, [todayKey]);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const s of completedSessions(workoutLogs, completions)) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    }
    return map;
  }, [workoutLogs, completions]);

  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const atCurrentMonth = isSameMonth(month, new Date());

  const options = getDays(profile.cadence);
  const selectedCompletion = selected ? completions.find((c) => c.date === selected) : null;
  const selectedLogs = selected
    ? workoutLogs.filter((w) => w.date === selected && w.status === "done")
    : [];
  const plannedDay = selected
    ? getDayByKey(profile.cadence, schedule[(parseISO(selected).getDay() + 6) % 7])
    : null;

  async function choose(title) {
    if (busy || !selected) return;
    setBusy(true);
    try {
      let rec;
      if (selectedCompletion) {
        if (selectedCompletion.session_name === title) return;
        rec = await db.entities.SessionCompletion.update(selectedCompletion.id, { session_name: title });
        setCompletions((prev) => prev.map((c) => (c.id === rec.id ? rec : c)));
      } else {
        rec = await db.entities.SessionCompletion.create({
          date: selected,
          session_name: title,
          journey_phase: journeyPhase || "",
          travel: false,
        });
        setCompletions((prev) => [...prev, rec]);
      }
      await deleteWeekSummaryForDate(selected);
      if (selected === todayStr) onTodayChange?.(rec);
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (busy || !selectedCompletion) return;
    setBusy(true);
    try {
      await db.entities.SessionCompletion.delete(selectedCompletion.id);
      setCompletions((prev) => prev.filter((c) => c.id !== selectedCompletion.id));
      await deleteWeekSummaryForDate(selected);
      if (selected === todayStr) onTodayChange?.(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="rounded-full p-1.5 text-foreground/40 transition-colors hover:text-accent"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <p className="text-sm text-foreground/80">{format(month, "MMMM yyyy")}</p>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={atCurrentMonth}
          className="rounded-full p-1.5 text-foreground/40 transition-colors hover:text-accent disabled:opacity-20 disabled:hover:text-foreground/40"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] uppercase tracking-[0.12em] text-foreground/30">
            {w.slice(0, 2)}
          </span>
        ))}
        {days.map((d) => {
          const ds = format(d, "yyyy-MM-dd");
          const inMonth = isSameMonth(d, month);
          const future = ds > todayStr;
          const logged = byDate.get(ds);
          const isSel = ds === selected;
          return (
            <button
              key={ds}
              disabled={future}
              onClick={() => setSelected(isSel ? null : ds)}
              className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-xs transition-colors ${
                isSel
                  ? "border border-accent/50 bg-accent/[0.1] text-accent"
                  : ds === todayStr
                  ? "border border-accent/25 text-foreground/80"
                  : "border border-transparent hover:bg-white/[0.04]"
              } ${inMonth ? "text-foreground/70" : "text-foreground/25"} disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent`}
            >
              {format(d, "d")}
              {logged && <span className="mt-0.5 h-1 w-1 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">
              {format(parseISO(selected), "EEE, MMM d")}
              {selected === todayStr ? " · today" : ""}
            </p>
            <button onClick={() => setSelected(null)} aria-label="Close">
              <X className="h-4 w-4 text-foreground/40 hover:text-foreground/70" />
            </button>
          </div>
          <p className="mt-2 text-[11px] font-light text-foreground/40">
            {selectedCompletion ? "Tap a different day to change it." : "Which session did you do?"}
          </p>
          <div className="mt-3 space-y-2">
            {options.map((opt) => {
              const active = selectedCompletion?.session_name === opt.title;
              return (
                <button
                  key={String(opt.day)}
                  onClick={() => choose(opt.title)}
                  disabled={busy}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-60 ${
                    active
                      ? "border-accent/40 bg-accent/[0.08] text-accent"
                      : "border-white/[0.05] bg-white/[0.015] text-foreground/80 hover:border-accent/25"
                  }`}
                >
                  <span>{opt.title}</span>
                  {active ? (
                    <Check className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    plannedDay?.title === opt.title && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/30">Planned</span>
                    )
                  )}
                </button>
              );
            })}
          </div>
          {selectedCompletion &&
            !options.some((o) => o.title === selectedCompletion.session_name) && (
              <p className="mt-3 text-xs text-foreground/60">
                Logged: <span className="text-accent">{selectedCompletion.session_name}</span>
              </p>
            )}
          {selectedLogs.length > 0 && (
            <p className="mt-3 text-[11px] font-light text-foreground/40">
              Also logged: {selectedLogs.map((w) => w.session_name || w.mode).join(", ")}
            </p>
          )}
          {selectedCompletion && (
            <button
              onClick={clear}
              disabled={busy}
              className="mt-3 text-xs font-light text-foreground/40 transition-colors hover:text-accent"
            >
              Clear this day
            </button>
          )}
        </div>
      )}
    </div>
  );
}
