import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Scale } from "lucide-react";
import { format, subDays } from "date-fns";
import { db } from "@/api/db";
import { motion } from "framer-motion";
import DateNav from "@/components/fuel/DateNav";
import DualGauge from "@/components/fuel/DualGauge";
import MealsLogger from "@/components/fuel/MealsLogger";
import FuelStreakBadge from "@/components/fuel/FuelStreakBadge";
import WeighIn from "@/components/fuel/WeighIn";
import LogWeightSheet from "@/components/fuel/LogWeightSheet";
import WeightTrendChart from "@/components/fuel/WeightTrendChart";
import WinningWeek from "@/components/fuel/WinningWeek";
import ReviewDays from "@/components/fuel/ReviewDays";
import { computeBaseline, dailyProteinTarget } from "@/lib/metabolism";
import { computeDailyTarget } from "@/lib/winningWeek";
import { findBounceBackDay, dismissedBounceBack, dismissBounceBack, bounceBackTargetFor } from "@/lib/bounceBack";
import { dedupeByDate } from "@/lib/dedupe";
import { deleteWeekSummaryForDate } from "@/lib/weeklySummarySync";
import BounceBackCard from "@/components/fuel/BounceBackCard";

// dayComplete=false (today) → progress language only: under shows the gap to
// target, in is "On target", over keeps the existing over-target wording.
// dayComplete=true (a past day) → the verdict-style coach lines are shown.
function proximity(intake, maintenance, target, goal, dayComplete) {
  if (!intake) return { maint: "Log your calories to see where today lands.", target: "" };
  const dt = Number(intake) - target;

  if (!dayComplete) {
    let targetLine;
    if (dt < -0.5) targetLine = `${Math.round(Math.abs(dt)).toLocaleString()} kcal to target · keep fueling`;
    else if (dt > 0.5) targetLine = goal === "gain" ? "Over target — building." : "Over target — still moving.";
    else targetLine = "On target";
    return { maint: "", target: targetLine };
  }

  const d = Number(intake) - maintenance;
  let maint;
  if (Math.abs(d) < 120) maint = "Right around maintenance — cruising.";
  else if (d < 0) maint = d > -400 ? "A little under maintenance — solid day." : "Well under maintenance — light day.";
  else maint = d < 400 ? "A touch over maintenance — easy does it." : "Above maintenance — fueling up.";

  let targetLine = "";
  if (goal !== "maintain") {
    if (Math.abs(dt) < 120) targetLine = "Right on your target — dialed in.";
    else if (goal === "lose") targetLine = dt < 0 ? "Under target — in the zone." : "Over target — still moving.";
    else targetLine = dt > 0 ? "Over target — building." : "Under target — keep fueling.";
  }
  return { maint, target: targetLine };
}

const sumCal = (ms) => ms.reduce((s, m) => s + (Number(m.calories) || 0), 0);
const sumPro = (ms) => ms.reduce((s, m) => s + (Number(m.protein) || 0), 0);
const renumber = (arr) => arr.map((m, i) => ({ ...m, n: i + 1 }));

// Consecutive tracked days (calories > 0, not voided) ending today — or ending
// yesterday if today isn't logged yet. Same tier/emoji logic StreakBadge uses
// everywhere else; the Fuel badge just renders it larger.
function fuelTrackingStreak(logs, today = new Date()) {
  const set = new Set(
    (logs || [])
      .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0 && !l.voided)
      .map((l) => l.date)
  );
  const todayStr = format(today, "yyyy-MM-dd");
  let cur = set.has(todayStr) ? new Date(today) : subDays(today, 1);
  let streak = 0;
  while (set.has(format(cur, "yyyy-MM-dd"))) {
    streak++;
    cur = subDays(cur, 1);
  }
  return streak;
}

export default function FuelDaily({ initialDate }) {
  const [profile, setProfile] = useState(null);
  const [log, setLog] = useState(null);
  const [meals, setMeals] = useState([]);
  const [weighIns, setWeighIns] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [logWeightOpen, setLogWeightOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });
  const [bbHidden, setBbHidden] = useState(false);
  const [weekLogs, setWeekLogs] = useState([]);
  const [streakLogs, setStreakLogs] = useState([]);
  const [wwRefresh, setWwRefresh] = useState(0);
  const [dayRollNote, setDayRollNote] = useState(false);
  const writeLockRef = useRef(false);
  const viewDateRef = useRef(viewDate);
  const lastTodayRef = useRef(format(new Date(), "yyyy-MM-dd"));
  const uidCounter = useRef(0);
  const nextUid = () => {
    uidCounter.current += 1;
    return uidCounter.current;
  };

  useEffect(() => {
    (async () => {
      const [profiles, w, h, dl] = await Promise.all([
        db.entities.Profile.list(),
        db.entities.WeighIn.list("-date", 365),
        db.entities.MaintenanceHistory.list("-date", 50),
        db.entities.DailyLog.list("-date", 400),
      ]);
      setProfile(profiles[0]);
      setWeighIns(w);
      setHistory(h);
      setStreakLogs(dl);
      setLoading(false);
    })();
  }, []);

  // Current week's logs — used to compute the bounce-back target line after a
  // >800-kcal overage earlier in the week.
  useEffect(() => {
    if (loading) return;
    db.entities.DailyLog.list("-date", 60)
      .then(setWeekLogs)
      .catch(() => {});
  }, [loading]);

  // Load the DailyLog for whichever date is being viewed (today by default;
  // backfilled past days load their own record and are edited in place). The
  // working meals array carries a runtime uid for stable list animations; the
  // stored meals never include uid.
  useEffect(() => {
    if (loading) return;
    viewDateRef.current = viewDate;
    const dateStr = format(viewDate, "yyyy-MM-dd");
    db.entities.DailyLog.filter({ date: dateStr }).then((logs) => {
      const l = dedupeByDate(logs)[0] || null;
      setLog(l);
      const stored = l?.meals?.length ? l.meals.map((m) => ({ ...m, uid: nextUid() })) : [];
      setMeals(stored);
    });
  }, [viewDate, loading]);

  // Date resync — recompute "today" when the tab regains focus or visibility. If
  // the calendar day rolled over while the member was viewing today, follow the
  // new day with a quiet inline note.
  useEffect(() => {
    function check() {
      const newToday = format(new Date(), "yyyy-MM-dd");
      const viewingToday = format(viewDateRef.current, "yyyy-MM-dd") === lastTodayRef.current;
      if (viewingToday && newToday !== lastTodayRef.current) {
        setViewDate(new Date());
        setDayRollNote(true);
        setTimeout(() => setDayRollNote(false), 4000);
      }
      lastTodayRef.current = newToday;
    }
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  // A log with totals but no meals array is a legacy day total until the first
  // meal op migrates it into meal 1.
  const hasLegacyTotal = !meals.length && ((log?.calories ?? 0) > 0 || (log?.protein ?? 0) > 0);
  const totals = useMemo(() => {
    if (meals.length) return { calories: sumCal(meals), protein: sumPro(meals) };
    if (hasLegacyTotal) return { calories: log?.calories || 0, protein: log?.protein || 0 };
    return { calories: 0, protein: 0 };
  }, [meals, hasLegacyTotal, log]);
  const calories = totals.calories;
  const protein = totals.protein;

  // Today's tracking streak — merges the one-time log fetch with the live
  // today record so it updates the moment today gets logged.
  const streak = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const merged = [...streakLogs];
    if (log && log.date === todayStr) {
      const idx = merged.findIndex((l) => l.date === todayStr);
      if (idx >= 0) merged[idx] = log;
      else merged.push(log);
    }
    return fuelTrackingStreak(merged);
  }, [streakLogs, log]);

  // DailyLog singularity — before creating, re-check for an existing row for
  // that date and update it instead. An in-flight lock stops a double tap from
  // double-creating. Every write computes its date at write time from the
  // currently displayed date.
  async function saveDay(dateStr, payload, knownLog) {
    if (writeLockRef.current) return null;
    writeLockRef.current = true;
    try {
      if (knownLog) {
        return await db.entities.DailyLog.update(knownLog.id, { ...payload, date: dateStr });
      }
      const existing = await db.entities.DailyLog.filter({ date: dateStr });
      const prior = dedupeByDate(existing)[0] || null;
      if (prior) {
        return await db.entities.DailyLog.update(prior.id, { ...payload, date: dateStr });
      }
      return await db.entities.DailyLog.create({ ...payload, date: dateStr });
    } finally {
      writeLockRef.current = false;
    }
  }

  // After a past-day write, delete that week's WeeklySummary so the next load
  // regrades it (older untouched weeks stay frozen). Reload the scorecard.
  function syncWeekForDate(dateStr) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (dateStr === todayStr) return;
    deleteWeekSummaryForDate(dateStr);
    setWwRefresh((k) => k + 1);
  }

  // Explicit save: recompute the sums (which always equal the meal totals) and
  // write { date, calories, protein, meals }. Returns whether it succeeded.
  async function persist(newMeals) {
    const dateStr = format(viewDate, "yyyy-MM-dd");
    const renumbered = renumber(newMeals);
    const toSave = renumbered.map(({ uid, legacy, ...rest }) => rest);
    const payload = {
      date: dateStr,
      calories: sumCal(renumbered),
      protein: sumPro(renumbered),
      meals: toSave,
    };
    setSaving(true);
    try {
      const res = await saveDay(dateStr, payload, log);
      if (!res) return false;
      setLog(res);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);
      syncWeekForDate(dateStr);
      return true;
    } catch (e) {
      return false;
    } finally {
      setSaving(false);
    }
  }

  // On the first meal op of a legacy day, the day total becomes meal 1.
  function migrateBase() {
    if (meals.length) return meals;
    if (hasLegacyTotal) {
      return [
        {
          uid: nextUid(),
          n: 1,
          calories: log.calories,
          protein: log.protein,
          logged_at: new Date().toISOString(),
        },
      ];
    }
    return [];
  }

  // Write before celebration: meals state updates ONLY after the write resolves.
  // On failure the Add box keeps its values (guard E) and returns false.
  async function handleAdd(cal, pro) {
    const base = migrateBase();
    const newMeals = [
      ...base,
      { uid: nextUid(), n: base.length + 1, calories: cal, protein: pro, logged_at: new Date().toISOString() },
    ];
    const ok = await persist(newMeals);
    if (ok) {
      setMeals(renumber(newMeals));
      setNonce((n) => n + 1);
    }
    return ok;
  }

  async function handleEditTotal(cal, pro) {
    const dateStr = format(viewDate, "yyyy-MM-dd");
    const payload = { date: dateStr, calories: cal, protein: pro, meals: [] };
    setSaving(true);
    try {
      const res = await saveDay(dateStr, payload, log);
      if (!res) return;
      setLog(res);
      setMeals([]);
      setNonce((n) => n + 1);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1400);
      syncWeekForDate(dateStr);
    } catch (e) {
      /* leave gauges untouched on failure */
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const b = computeBaseline(profile);
  const proteinTarget = dailyProteinTarget(profile);
  const daily = computeDailyTarget(profile, history);
  const maintenance = daily.maintenance;
  const target = daily.target;
  const isToday = format(viewDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const dayComplete = !isToday;
  const prox = proximity(calories, maintenance, target, b.goalType, dayComplete);
  const periodized = daily.periodized;
  const bounce = log ? findBounceBackDay({ profile, history, dailyLogs: [log] }) : null;
  const showBounce = !!bounce && !bbHidden && dismissedBounceBack() !== bounce.date;
  const handleBounceDismiss = () => {
    if (bounce) dismissBounceBack(bounce.date);
    setBbHidden(true);
  };
  // Bounce-back target line shows on today only (the day after an overage).
  const bounceBackTarget = isToday
    ? bounceBackTargetFor({ profile, history, dailyLogs: weekLogs })
    : null;

  const dateStr = format(viewDate, "yyyy-MM-dd");

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto min-h-screen w-full max-w-md px-6 pb-32 pt-14"
    >
      <FuelStreakBadge count={streak} />
      <div className="mt-12">
        <p className="mb-4 text-center text-[10px] uppercase tracking-[0.32em] text-foreground/40">Fuel</p>
        <DateNav viewDate={viewDate} onChange={setViewDate} />
        {dayRollNote && (
          <p className="mt-2 text-center text-[11px] font-light text-accent">New day started</p>
        )}

      {showBounce && (
        <div className="mt-4">
          <BounceBackCard hack={bounce.hack} onDismiss={handleBounceDismiss} />
        </div>
      )}

      <DualGauge
        intake={calories}
        maintenance={maintenance}
        target={target}
        goal={b.goalType}
        protein={protein}
        proteinTarget={proteinTarget}
        bounceBack={bounceBackTarget}
        dayComplete={dayComplete}
        animateNonce={nonce}
      />

      <div className="mt-7 space-y-1.5 text-center">
        {log?.voided && (
          <span className="inline-block rounded-full border border-accent/30 bg-accent/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-accent/80">
            Voided
          </span>
        )}
        {prox.maint && <p className="text-sm font-light leading-relaxed text-foreground/65">{prox.maint}</p>}
        {prox.target && <p className="text-xs font-light leading-relaxed text-foreground/45">{prox.target}</p>}
        {periodized && (
          <p className="text-[11px] font-light text-accent/70">
            Periodization on — today's a {daily.isTraining ? "training day" : "rest day"}, target {target.toLocaleString()} cal.{" "}
            Same weekly average.
          </p>
        )}
      </div>

      <MealsLogger
        key={dateStr}
        calories={calories}
        protein={protein}
        animateNonce={nonce}
        saving={saving}
        onAdd={handleAdd}
        onEditTotal={handleEditTotal}
      />

      <div className="mt-2 h-4 text-right">
        <span
          className={`text-[11px] transition-opacity duration-300 ${
            savedFlash || saving ? "text-accent/80 opacity-100" : "opacity-0"
          }`}
        >
          {saving ? "Saving…" : "Saved"}
        </span>
      </div>

      <div className="mt-7 flex justify-center">
        <Link
          to="/fuel/maintenance"
          className="group flex items-center gap-1.5 text-xs text-foreground/40 transition-colors hover:text-accent"
        >
          Your maintenance · Refine
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>
      </div>

      <button
        onClick={() => setLogWeightOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-medium text-primary-foreground glow-sm transition-all hover:glow-md"
      >
        <Scale className="h-4 w-4" strokeWidth={2} /> Log Weight
      </button>

      <WeighIn
        profile={profile}
        weighIns={weighIns}
        onLogged={async () => setWeighIns(await db.entities.WeighIn.list("-date", 365))}
      />

      <WeightTrendChart weighIns={weighIns} profile={profile} />

      <ReviewDays onChanged={() => setWwRefresh((k) => k + 1)} />

      <WinningWeek refreshKey={wwRefresh} />

      <LogWeightSheet
        open={logWeightOpen}
        onClose={() => setLogWeightOpen(false)}
        weighIns={weighIns}
        profile={profile}
        onSaved={async () => setWeighIns(await db.entities.WeighIn.list("-date", 365))}
      />
      </div>
    </motion.main>
  );
}