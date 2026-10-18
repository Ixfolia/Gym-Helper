import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { db } from "@/api/db";
import ScreenShell from "@/components/ScreenShell";
import HabitSlot from "@/components/habits/HabitSlot";
import { currentWeekRange, habitWeeklyStats } from "@/lib/weekScore";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const todayStr = () => format(new Date(), "yyyy-MM-dd");

export default function Habits() {
  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState(["", "", ""]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profiles, recentLogs] = await Promise.all([
        db.entities.Profile.list(),
        db.entities.HabitLog.list("-date", 400),
      ]);
      const p = profiles[0] || null;
      setProfile(p);
      const saved = p?.habits && p.habits.length ? p.habits : ["", "", ""];
      setHabits([...saved, "", "", ""].slice(0, 3));
      setLogs(recentLogs);
      setLoading(false);
    })();
  }, []);

  async function refreshLogs() {
    setLogs(await db.entities.HabitLog.list("-date", 60));
  }

  async function toggle(name) {
    if (!name) return;
    const t = todayStr();
    const existing = logs.find((l) => l.habit_name === name && l.date === t);
    if (existing) {
      await db.entities.HabitLog.update(existing.id, { done: !existing.done });
    } else {
      await db.entities.HabitLog.create({ date: t, habit_name: name, done: true });
    }
    refreshLogs();
  }

  async function rename(index, newName) {
    const next = [...habits];
    next[index] = newName;
    setHabits(next);
    if (profile) {
      await db.entities.Profile.update(profile.id, { habits: next });
    } else {
      const p = await db.entities.Profile.create({ cadence: "3-5", track: "A", habits: next });
      setProfile(p);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const t = todayStr();
  const week = currentWeekRange(profile);

  return (
    <ScreenShell eyebrow="Habits" title="Three habits. Clean consistency.">
      {habits.filter((h) => h).length === 0 && (
        <div className="mb-4 rounded-2xl border border-accent/30 bg-accent/[0.05] p-4 text-sm font-light leading-relaxed text-foreground/70">
          Pick at least one habit to start tracking — name your first habit below.
        </div>
      )}
      <div className="space-y-4">
        {habits.map((name, i) => {
          const done = logs.some((l) => l.habit_name === name && l.date === t && l.done);
          const doneDates = new Set(
            logs.filter((l) => l.habit_name === name && l.done && l.date).map((l) => l.date)
          );
          const habitDates = logs.filter((l) => l.habit_name === name && l.date).map((l) => l.date).sort();
          const createdDate = habitDates.length ? habitDates[0] : null;
          const stats = name ? habitWeeklyStats(name, logs, week) : { streak: 0, pct: 0 };
          return (
            <HabitSlot
              key={i}
              index={i}
              name={name}
              done={done}
              doneDates={doneDates}
              createdDate={createdDate}
              onToggle={toggle}
              onRename={rename}
              streak={stats.streak}
              weekPct={stats.pct}
            />
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" strokeWidth={1.75} />
        <p className="text-xs font-light leading-relaxed text-foreground/50">
          Not sure which 3 habits?{" "}
          <Link to="/coach" className="text-accent underline-offset-2 hover:underline">
            Text your coach
          </Link>{" "}
          what you're struggling with.
        </p>
      </div>
    </ScreenShell>
  );
}