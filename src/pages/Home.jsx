import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { db } from "@/api/db";
import { withRetry, mapLimit } from "@/lib/retry";
import WinTheWeekCard from "@/components/home/WinTheWeekCard";
import WeightSparkline from "@/components/home/WeightSparkline";
import CalorieCard from "@/components/home/CalorieCard";
import PhaseHero from "@/components/home/PhaseHero";
import AscentCard from "@/components/home/AscentCard";
import PhaseUnlockDialog from "@/components/journey/PhaseUnlockDialog";
import HabitsCard from "@/components/home/HabitsCard";
import TrajectoryCard from "@/components/home/TrajectoryCard";
import CoachDashboard from "@/components/home/CoachDashboard";
import MirrorCheckCard from "@/components/home/MirrorCheckCard";
import ConsistencyCard from "@/components/home/ConsistencyCard";
import WeeklyCaloriesCard from "@/components/home/WeeklyCaloriesCard";
import LogWeightSheet from "@/components/fuel/LogWeightSheet";
import WeightUnitToggle from "@/components/fuel/WeightUnitToggle";
import { useWeightUnit } from "@/lib/weightUnitContext";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";
import { computeDailyTarget, computeWinningWeeks } from "@/lib/winningWeek";
import { dedupeByDate } from "@/lib/dedupe";
import { targetWeightKg, computePace, parseTimeframe, dailyProteinTarget } from "@/lib/metabolism";
import { findBounceBackDay, bounceBackTargetFor, dismissedBounceBack, dismissBounceBack } from "@/lib/bounceBack";
import { findThrottleOccurrence, dismissedThrottle, dismissThrottle } from "@/lib/throttleStreak";
import BounceBackCard from "@/components/fuel/BounceBackCard";
import ThrottleCard from "@/components/home/ThrottleCard";
import {
  currentWeekRange,
  trackedPctThisWeek,
  habitPctThisWeek,
  workoutPctThisWeek,
  trackingStreak,
  habitStreak,
  habitWeeklyStats,
} from "@/lib/weekScore";
import { JOURNEY, flattenSteps } from "@/lib/journey";
import { evaluateAll, stepProgress, phaseFraction, derivePhaseStep, completedPhaseToCelebrate } from "@/lib/journeyEngine";
import { normalizePick } from "@/lib/splits";
import { ArrowUpRight, Scale, Settings } from "lucide-react";

export default function Home() {
  const [d, setData] = useState(null);
  const [logWeightOpen, setLogWeightOpen] = useState(false);
  const [bbHidden, setBbHidden] = useState(false);
  const [throttleHidden, setThrottleHidden] = useState(false);
  const { unit, setUnit } = useWeightUnit();

  const [dialogPhase, setDialogPhase] = useState(null);
  const [celebrationStage, setCelebrationStage] = useState("idle");
  const celebratedRef = useRef("0");
  const pendingRef = useRef(null);

  // Derived active phase + step, computed unconditionally (before the early
  // returns) so the persist + celebration effects below can read it.
  const journeyDerived = useMemo(() => {
    if (!d?.profile) return null;
    const ctx = {
      profile: d.profile,
      logs: d.dailyLogs,
      dailyLogs: d.dailyLogs,
      weighIns: d.weighIns,
      workoutLogs: d.workoutLogs,
      sessionCompletions: d.allSessionCompletions,
      habitLogs: d.habitLogs,
      history: d.history,
      weeklySummaries: d.weeklySummaries,
      progressPhotos: d.progressPhotos,
    };
    const em = evaluateAll(ctx);
    const recByStep = {};
    for (const r of d.journeyProgress) recByStep[r.step] = r;
    return { derived: derivePhaseStep(em, recByStep) };
  }, [d]);

  // celebratedRef is the client-side guard: the MAX of the loaded profile's
  // last_celebrated_phase and the localStorage marker, so a stale or duplicate
  // profile row can never replay a celebration already seen in this browser.
  useEffect(() => {
    const profVal = Number(d?.profile?.last_celebrated_phase || "0") || 0;
    let lsVal = 0;
    try {
      lsVal = Number(localStorage.getItem("peak_last_celebrated_phase") || "0") || 0;
    } catch (e) {
      lsVal = 0;
    }
    celebratedRef.current = String(Math.max(profVal, lsVal));
  }, [d?.profile?.last_celebrated_phase]);

  const celebrating = celebrationStage !== "idle";

  // Persist the derived phase + step, and — on the first Home render where the
  // derived phase is past last_celebrated_phase — fire the one-time-per-phase
  // celebration. A single timeline drives BOTH the hero (PhaseHero) and the
  // Ascent card in sync: rising (~600ms) → burst (~900ms) → clearing (~400ms)
  // → idle, then ~300ms later the compact "unlocked" dialog opens. Journey
  // never celebrates; the reward waits for the member to return to Home.
  // last_celebrated_phase is persisted TWICE for safety — the instant the
  // celebration starts (so a member who never dismisses the dialog still
  // never sees this phase's celebration twice) and again on "Let's climb"
  // (dismissCelebration) — and the local profile state is updated after each
  // persist so the same session can't replay it. The trigger reads the
  // freshly loaded profile value (celebratedRef, synced from the loaded
  // profile) so a reload honors the persisted marker. Persist errors are
  // surfaced to the console, never swallowed.
  useEffect(() => {
    if (!journeyDerived || !d?.profile) return;
    const profile = d.profile;
    const { derived } = journeyDerived;
    if (
      profile.current_journey_phase !== derived.label ||
      profile.current_journey_step !== (derived.stepId || "")
    ) {
      db.entities.Profile.update(profile.id, {
        current_journey_phase: derived.label,
        current_journey_step: derived.stepId || "",
      }).catch((err) => console.error("[celebration] failed to persist current journey phase/step:", err));
    }
    const cp = completedPhaseToCelebrate(derived, celebratedRef.current);
    const profPhase = Number(profile.last_celebrated_phase || "0") || 0;
    let lsPhase = 0;
    try {
      lsPhase = Number(localStorage.getItem("peak_last_celebrated_phase") || "0") || 0;
    } catch (e) {
      lsPhase = 0;
    }
    // Deterministic client guard: the completed phase must be greater than BOTH
    // the loaded profile's marker and the localStorage marker before the
    // celebration may fire.
    if (
      cp !== null &&
      cp > profPhase &&
      cp > lsPhase &&
      dialogPhase === null &&
      !celebrating &&
      pendingRef.current === null
    ) {
      const phaseStr = String(cp);
      // Synchronously stamp localStorage BEFORE any animation or network call,
      // so a second visit (or a duplicate profile row) can never replay this.
      try {
        localStorage.setItem("peak_last_celebrated_phase", phaseStr);
      } catch (e) {
        console.error("[celebration] failed to write localStorage guard:", e);
      }
      celebratedRef.current = phaseStr;
      // Persist immediately + mirror into local state so this session and the
      // next load both treat this phase as already celebrated. The existing
      // profile persists are kept as-is.
      setData((prev) =>
        prev && prev.profile
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                last_celebrated_phase: phaseStr,
                current_journey_phase: derived.label,
                current_journey_step: derived.stepId || "",
              },
            }
          : prev
      );
      db.entities.Profile
        .update(profile.id, { last_celebrated_phase: phaseStr })
        .catch((err) => console.error("[celebration] failed to persist last_celebrated_phase at start:", err));
      pendingRef.current = cp;
      setCelebrationStage("rising");
    }
  }, [journeyDerived, d?.profile, dialogPhase, celebrating]);

  // Single timeline for the phase-complete celebration. rising (600ms) →
  // burst (900ms) → clearing (400ms) → idle. Both PhaseHero and AscentCard
  // read celebrationStage and render the same stage at the same instant.
  // When clearing ends, the timeline goes idle and ~300ms later opens the
  // unlock dialog.
  useEffect(() => {
    if (celebrationStage === "idle") return;
    let t;
    if (celebrationStage === "rising") {
      t = window.setTimeout(() => setCelebrationStage("burst"), 600);
    } else if (celebrationStage === "burst") {
      t = window.setTimeout(() => setCelebrationStage("clearing"), 900);
    } else if (celebrationStage === "clearing") {
      t = window.setTimeout(() => {
        setCelebrationStage("idle");
        const cp = pendingRef.current;
        if (cp !== null) {
          window.setTimeout(() => {
            pendingRef.current = null;
            // The final phase has no "next phase" to unlock — play the card
            // celebration only and settle on Phase 4 at 100%.
            if (cp < JOURNEY[JOURNEY.length - 1].phase) {
              setDialogPhase(cp);
            }
          }, 300);
        }
      }, 400);
    }
    return () => window.clearTimeout(t);
  }, [celebrationStage]);

  function dismissCelebration() {
    if (dialogPhase !== null) {
      const phaseStr = String(dialogPhase);
      celebratedRef.current = phaseStr;
      setData((prev) =>
        prev && prev.profile
          ? { ...prev, profile: { ...prev.profile, last_celebrated_phase: phaseStr } }
          : prev
      );
      if (d?.profile?.id) {
        db.entities.Profile
          .update(d.profile.id, { last_celebrated_phase: phaseStr })
          .catch((err) => console.error("[celebration] failed to persist last_celebrated_phase on dismiss:", err));
      }
    }
    setDialogPhase(null);
  }

  useEffect(() => {
    (async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const [profiles, dailyLogs, weighIns, habitLogs, workoutLogs, history, journeyProgress, weeklySummaries, progressPhotos, sessionCompletions, allSessionCompletions] =
        await mapLimit([
          () => withRetry(() => db.entities.Profile.list()),
          () => withRetry(() => db.entities.DailyLog.list("-date", 60)),
          () => withRetry(() => db.entities.WeighIn.list("-date", 30)),
          () => withRetry(() => db.entities.HabitLog.list("-date", 400)),
          () => withRetry(() => db.entities.WorkoutLog.list("-date", 60)),
          () => withRetry(() => db.entities.MaintenanceHistory.list("-date", 50)),
          () => withRetry(() => db.entities.JourneyProgress.list("-date", 100)),
          () => withRetry(() => db.entities.WeeklySummary.list("-date", 50)),
          () => withRetry(() => db.entities.ProgressPhoto.list("-date", 20)),
          () => withRetry(() => db.entities.SessionCompletion.filter({ date: todayStr })),
          () => withRetry(() => db.entities.SessionCompletion.list("-date", 200)),
        ]);
      // If Profile.list ever returns more than one row, always use the most
      // recently updated one — and warn so the duplicate is visible. Every read
      // and update on Home uses this single row (d.profile), never profiles[0].
      let profileRow = Array.isArray(profiles) ? profiles[0] : null;
      if (Array.isArray(profiles) && profiles.length > 1) {
        console.warn(`[Home] Profile.list returned ${profiles.length} rows; using the most recently updated row.`);
        profileRow = profiles
          .slice()
          .sort((a, b) => {
            const at = a?.updated_date ? new Date(a.updated_date).getTime() : 0;
            const bt = b?.updated_date ? new Date(b.updated_date).getTime() : 0;
            return bt - at;
          })[0];
      }
      console.log("[Home] loaded profile last_celebrated_phase:", profileRow?.last_celebrated_phase ?? null);

      // Migrate legacy retarget_areas (string entries) into {area, sub?} objects
      // once. Profiles from before the allocation update stored picks as strings;
      // the schema now requires objects, so an unmigrated row breaks every
      // Profile.update. On the first load where strings are present, normalize
      // every entry and persist the migrated array once; the migrated value is
      // used in memory either way.
      if (profileRow && Array.isArray(profileRow.retarget_areas)) {
        const hasLegacy = profileRow.retarget_areas.some((p) => typeof p === "string");
        if (hasLegacy) {
          const migrated = profileRow.retarget_areas
            .map((p) => {
              const n = normalizePick(p);
              const entry = { area: n.area };
              if (n.sub) entry.sub = n.sub;
              if (p && typeof p === "object" && p.allocation != null) entry.allocation = p.allocation;
              return entry;
            })
            .filter((e) => e.area);
          profileRow = { ...profileRow, retarget_areas: migrated };
          db.entities.Profile
            .update(profileRow.id, { retarget_areas: migrated })
            .catch((err) => console.error("[Home] failed to migrate legacy retarget_areas:", err));
        }
      }

      setData({
        profile: profileRow,
        dailyLogs: dedupeByDate(dailyLogs),
        weighIns,
        habitLogs,
        workoutLogs,
        history,
        journeyProgress,
        weeklySummaries,
        progressPhotos,
        sessionCompletion: sessionCompletions[0] || null,
        allSessionCompletions: allSessionCompletions,
        todayStr,
      });
    })();
  }, []);

  async function refreshWeighIns() {
    const weighIns = await db.entities.WeighIn.list("-date", 30);
    setData((prev) => (prev ? { ...prev, weighIns } : prev));
  }

  // Signed URLs for private Mirror Check photos — the stored file_url is a
  // private URI that won't render directly, so we mint a signed URL per photo
  // (same pattern as the Mirror page) for the Home thumbnails.
  const [photoUrls, setPhotoUrls] = useState({});
  useEffect(() => {
    const pList = d?.progressPhotos;
    if (!pList?.length) return;
    let cancelled = false;
    (async () => {
      try {
        const urls = await db.photos.urls(pList.map((p) => p.id));
        if (!cancelled) setPhotoUrls(urls);
      } catch {
        if (!cancelled) setPhotoUrls({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [d?.progressPhotos]);

  if (!d) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const profile = d.profile;

  // No profile yet — calm empty state, no shame.
  if (!profile) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 pb-32 text-center"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Coach's Dashboard</p>
        <p className="mt-6 font-display text-2xl font-light text-foreground/80">Start with your baseline.</p>
        <p className="mt-3 text-sm font-light leading-relaxed text-foreground/45">
          Set your fuel targets and the dashboard comes to life — one glance, every day.
        </p>
        <Link
          to="/fuel"
          className="mt-8 rounded-2xl bg-accent px-6 py-3 text-sm text-primary-foreground glow-sm transition-all hover:glow-md"
        >
          Get Dialed In
        </Link>
      </motion.main>
    );
  }

  async function setCustomTarget(newTarget) {
    const rounded = Math.round(newTarget);
    await db.entities.Profile.update(profile.id, { custom_target: rounded });
    setData((prev) =>
      prev && prev.profile ? { ...prev, profile: { ...prev.profile, custom_target: rounded } } : prev
    );
  }

  const todayLog = d.dailyLogs.find((l) => l.date === d.todayStr);
  const intake = todayLog?.calories ?? 0;
  const protein = todayLog?.protein ?? 0;
  const { maintenance, target } = computeDailyTarget(profile, d.history);
  const proteinTarget = dailyProteinTarget(profile);
  const coachPace = computePace(
    maintenance,
    profile.goal,
    profile.goal_amount || 0,
    parseTimeframe(profile.goal_timeframe),
    profile.sex
  );
  const coachRecDelta = coachPace.maintain ? 0 : coachPace.dailyDelta;
  const bounce = findBounceBackDay({ profile, history: d.history, dailyLogs: d.dailyLogs });
  const bbTargetInfo = bounceBackTargetFor({ profile, history: d.history, dailyLogs: d.dailyLogs });
  const showBounce = !!bounce && !bbHidden && dismissedBounceBack() !== bounce.date;
  const bounceBackTarget = showBounce && bbTargetInfo ? bbTargetInfo.target : null;
  const handleBounceDismiss = () => {
    if (bounce) dismissBounceBack(bounce.date);
    setBbHidden(true);
  };

  const throttle = findThrottleOccurrence({ maintenance, dailyLogs: d.dailyLogs });
  const showThrottle = !!throttle && !throttleHidden && dismissedThrottle() !== throttle.startDate;
  const handleThrottleDismiss = () => {
    if (throttle) dismissThrottle(throttle.startDate);
    setThrottleHidden(true);
  };

  // Consistency — current week only (weigh-in day to weigh-in day). A fresh
  // scoreboard every week; never 30-day or all-time.
  const week = currentWeekRange(profile);
  const trackedPct = trackedPctThisWeek(d.dailyLogs, week);
  const habitPct = habitPctThisWeek(profile, d.habitLogs, week);
  const workoutPct = workoutPctThisWeek(profile, d.workoutLogs, d.allSessionCompletions, week);
  const tStreak = trackingStreak(d.dailyLogs);
  const hStreak = habitStreak(profile, d.habitLogs);

  // Weight sparkline.
  const sparkData = [...d.weighIns]
    .filter((w) => w.date && typeof w.weight === "number")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map((w) => ({ date: w.date, weight: w.weight }));

  // Winning week.
  const ww = computeWinningWeeks(profile, d.dailyLogs, d.weighIns, d.habitLogs, d.workoutLogs, d.history, d.allSessionCompletions, d.weeklySummaries, d.journeyProgress);
  const onTrack =
    ww.current && ww.current.avgCalories !== null && Math.abs(ww.current.avgCalories - ww.target) <= ww.zone;

  // Journey current phase + step — matches the Journey tab exactly: the first
  // ordered step that isn't done, where "done" = stored done record OR an
  // auto/flex step whose real-data signal is satisfied (gate/manual never auto).
  // One shared journey context — the same object feeds evaluateAll, every
  // stepProgress call, and (via phaseSteps) phaseFraction. progressPhotos is
  // included so the baseline-photo signal and bar see Mirror Check uploads.
  const journeyCtx = {
    profile,
    logs: d.dailyLogs,
    dailyLogs: d.dailyLogs,
    weighIns: d.weighIns,
    workoutLogs: d.workoutLogs,
    sessionCompletions: d.allSessionCompletions,
    habitLogs: d.habitLogs,
    history: d.history,
    weeklySummaries: d.weeklySummaries,
    progressPhotos: d.progressPhotos,
  };
  const evalMap = evaluateAll(journeyCtx);
  const recByStep = {};
  for (const r of d.journeyProgress) recByStep[r.step] = r;
  const isDone = (id) => {
    if (recByStep[id]?.status === "done") return true;
    const e = evalMap[id];
    return !!e && e.mode !== "gate" && e.mode !== "manual" && e.autoDone;
  };
  const current = flattenSteps().find((s) => !isDone(s.id));
  let phaseLabel = "";
  let stepLabel = "";
  if (!current) {
    const lastPhase = JOURNEY[JOURNEY.length - 1];
    phaseLabel = `Phase ${lastPhase.phase} · ${lastPhase.name}`;
    stepLabel = "Every step done";
  } else {
    const phase = JOURNEY.find((ph) => ph.steps.some((s) => s.id === current.id));
    phaseLabel = `Phase ${phase.phase} · ${phase.name}`;
    stepLabel = current.title;
  }

  // Calm, supportive headline — energizing even in an off week, never shaming.
  const head = !ww.hasWeighIns
    ? "Your scoreboard starts now."
    : onTrack
    ? "You're in the zone."
    : "A fresh week. A fresh climb.";
  const sub = !ww.hasWeighIns
    ? "Log a week and step on the scale — the dashboard lights up from here."
    : onTrack
    ? "Keep the rhythm — this is what a winning week feels like."
    : "Every log from here moves the bar. Keep going.";

  // Desktop Coach's Dashboard — same data, a richer multi-panel presentation on
  // wide screens. The phone layout below is untouched (lg:hidden).
  const weightPoints = [...d.weighIns]
    .filter((w) => w.date && typeof w.weight === "number")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-16)
    .map((w) => ({ date: w.date, weight: w.weight }));

  const habitRows = (profile.habits || [])
    .filter((h) => h)
    .map((name) => {
      const doneToday = d.habitLogs.some((l) => l.habit_name === name && l.date === d.todayStr && l.done);
      const stats = habitWeeklyStats(name, d.habitLogs, week);
      return { name, doneToday, streak: stats.streak, pct: stats.pct };
    });

  const photos = [...(d.progressPhotos || [])]
    .filter((p) => p.file_url)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 4);

  const curPhase = current
    ? JOURNEY.find((ph) => ph.steps.some((s) => s.id === current.id))
    : JOURNEY[JOURNEY.length - 1];
  const phaseSteps = curPhase.steps.map((s) => ({
    title: s.title,
    status: isDone(s.id) ? "done" : s.id === current?.id ? "active" : "pending",
    progress: stepProgress(s.id, journeyCtx),
  }));
  const phasePct = phaseSteps.length > 0
    ? Math.round(phaseFraction(phaseSteps.map((s) => ({ progress: s.progress, done: s.status === "done" }))) * 100)
    : 0;
  const ascentProgress = current ? stepProgress(current.id, journeyCtx) : null;

  // Celebration payload for the hero. The completing phase (cp, from
  // pendingRef) is shown during rising/burst; the derived phaseLabel /
  // stepLabel / pct — already the next phase — are the cross-fade target.
  const completingPhaseNum = pendingRef.current;
  const completingPhaseObj = completingPhaseNum ? JOURNEY.find((p) => p.phase === completingPhaseNum) : null;
  const heroCelebration = {
    stage: celebrationStage,
    completingPhaseNum: completingPhaseNum || 0,
    completingLabel: completingPhaseObj
      ? `Phase ${completingPhaseObj.phase} · ${completingPhaseObj.name}`
      : phaseLabel,
    completingStep: completingPhaseObj
      ? completingPhaseObj.steps[completingPhaseObj.steps.length - 1]?.title || "Phase complete"
      : stepLabel,
  };

  const view = {
    ww,
    intake,
    target,
    maintenance,
    goal: profile.goal,
    currentWeightKg: profile.current_weight,
    goalWeightKg: targetWeightKg(profile),
    coachRecDelta,
    onSetTarget: setCustomTarget,
    protein,
    proteinTarget,
    bounceBackHack: showBounce ? bounce.hack : null,
    bounceBackTarget,
    onBounceDismiss: handleBounceDismiss,
    throttleActive: showThrottle,
    onThrottleDismiss: handleThrottleDismiss,
    weightPoints,
    profile,
    weighIns: d.weighIns,
    trackedPct,
    habitPct,
    workoutPct,
    tStreak,
    hStreak,
    dailyLogs: d.dailyLogs,
    habitLogs: d.habitLogs,
    workoutLogs: d.workoutLogs,
    sessionCompletions: d.allSessionCompletions,
    ascent: {
      phaseLabel,
      stepLabel,
      progress: ascentProgress,
      steps: phaseSteps,
      allDone: !current,
      phasePct,
      celebrating,
      stage: celebrationStage,
    },
    heroCelebration,
    habits: habitRows,
    photos,
    photoUrls,
  };

  return (
    <>
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto min-h-screen w-full max-w-md px-6 pb-32 pt-14 lg:hidden"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Coach's Dashboard</p>
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-light text-foreground/30">{format(new Date(), "EEEE · MMM d")}</p>
          <Link to="/settings" aria-label="Settings" className="text-foreground/45 transition-colors hover:text-foreground/80">
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {showBounce && (
        <div className="mt-4">
          <BounceBackCard hack={bounce.hack} onDismiss={handleBounceDismiss} />
        </div>
      )}

      {showThrottle && (
        <div className="mt-3">
          <ThrottleCard onDismiss={handleThrottleDismiss} />
        </div>
      )}

      {/* Phase progress — the hero */}
      <div className="mt-5">
        <PhaseHero phaseLabel={phaseLabel} stepLabel={stepLabel} pct={phasePct} celebration={heroCelebration} />
      </div>

      <h1 className="mt-5 font-display text-[1.375rem] font-bold text-foreground/90">{head}</h1>
      <p className="mt-1 text-xs font-light leading-relaxed text-foreground/40">{sub}</p>

      {/* Aesthetic Ascent */}
      <div className="mt-3">
        <AscentCard ascent={view.ascent} />
      </div>

      {/* Today's Fuel */}
      <div className="mt-3">
        <CalorieCard
          intake={intake}
          target={target}
          maintenance={maintenance}
          goal={profile.goal}
          protein={protein}
          proteinTarget={proteinTarget}
          bounceBackTarget={bounceBackTarget}
        />
      </div>

      {/* Win the Week scoreboard */}
      <div className="mt-3">
        <WinTheWeekCard
          workoutPct={workoutPct}
          nutritionPct={trackedPct}
          habitPct={habitPct}
          streak={ww.streak ?? 0}
        />
      </div>

      {/* Weekly calories */}
      <div className="mt-3">
        <WeeklyCaloriesCard dailyLogs={d.dailyLogs} target={target} proteinTarget={proteinTarget} />
      </div>

      {/* Weight trend */}
      <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/35">Weight trend</p>
          <div className="flex items-center gap-2">
            {sparkData.length >= 2 && (
              <p className="font-mono text-xs text-foreground/50">
                {kgToUnit(sparkData[0].weight, unit)} → {kgToUnit(sparkData[sparkData.length - 1].weight, unit)} {unitLabel(unit)}
              </p>
            )}
            <WeightUnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
        <div className="mt-3">
          <WeightSparkline data={sparkData} />
        </div>
      </div>

      {/* Habits */}
      <div className="mt-3">
        <HabitsCard habits={habitRows} />
      </div>

      {/* Mirror Check */}
      {photos.length > 0 && <MirrorCheckCard photos={photos} photoUrls={photoUrls} className="mt-3" />}

      {/* Trajectory */}
      <div className="mt-3">
        <TrajectoryCard
          currentWeightKg={profile.current_weight}
          goalWeightKg={targetWeightKg(profile)}
          maintenance={maintenance}
          target={target}
          goal={profile.goal}
          sex={profile.sex}
          coachRecDelta={coachRecDelta}
          onSetTarget={setCustomTarget}
          />
      </div>

      {/* Consistency map */}
      <div className="mt-3">
        <ConsistencyCard
          dailyLogs={d.dailyLogs}
          habitLogs={d.habitLogs}
          workoutLogs={d.workoutLogs}
          habits={profile.habits || []}
          profile={profile}
          sessionCompletions={d.allSessionCompletions}
        />
      </div>

      {/* Quick actions */}
      <button
        onClick={() => setLogWeightOpen(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-semibold text-primary-foreground glow-sm transition-all hover:glow-md"
      >
        <Scale className="h-4 w-4" strokeWidth={2} /> Log Weight
      </button>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Link
          to="/fuel"
          className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition-all hover:border-accent/30"
        >
          <span className="text-sm text-foreground/75">Log today</span>
          <ArrowUpRight className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
        </Link>
        <Link
          to="/train"
          className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition-all hover:border-accent/30"
        >
          <span className="text-sm text-foreground/75">Today's session</span>
          <ArrowUpRight className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
        </Link>
        <Link
          to="/settings"
          className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition-all hover:border-accent/30"
        >
          <span className="text-sm text-foreground/75">Settings</span>
          <ArrowUpRight className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
        </Link>
      </div>
    </motion.main>

      <PhaseUnlockDialog
        open={dialogPhase !== null}
        completedPhase={dialogPhase}
        nextPhaseNumber={dialogPhase ? dialogPhase + 1 : null}
        nextPhaseName={dialogPhase ? JOURNEY.find((p) => p.phase === dialogPhase + 1)?.name || "" : ""}
        onDismiss={dismissCelebration}
      />

      <CoachDashboard view={view} onLogWeight={() => setLogWeightOpen(true)} />

      <LogWeightSheet
        open={logWeightOpen}
        onClose={() => setLogWeightOpen(false)}
        weighIns={d.weighIns}
        profile={profile}
        onSaved={refreshWeighIns}
      />
    </>
  );
}