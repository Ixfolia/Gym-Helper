import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import WinTheWeekCard from "@/components/home/WinTheWeekCard";
import CalorieCard from "@/components/home/CalorieCard";
import WeightTrendChart from "@/components/home/WeightTrendChart";
import AscentCard from "@/components/home/AscentCard";
import HabitsCard from "@/components/home/HabitsCard";
import ConsistencyCard from "@/components/home/ConsistencyCard";
import PhaseHero from "@/components/home/PhaseHero";
import TrajectoryCard from "@/components/home/TrajectoryCard";
import BounceBackCard from "@/components/fuel/BounceBackCard";
import ThrottleCard from "@/components/home/ThrottleCard";
import MirrorCheckCard from "@/components/home/MirrorCheckCard";
import WeeklyCaloriesCard from "@/components/home/WeeklyCaloriesCard";
import { ArrowUpRight, MessageCircle, Scale, Settings } from "lucide-react";

// Desktop-only "Coach's Dashboard" — a three-panel command center rendering the
// exact same Home data at higher density. The phone layout is untouched.
export default function CoachDashboard({ view, onLogWeight }) {
  const {
    ww,
    intake,
    target,
    maintenance,
    goal,
    currentWeightKg,
    goalWeightKg,
    protein,
    proteinTarget,
    weightPoints,
    profile,
    weighIns,
    trackedPct,
    habitPct,
    workoutPct,
    tStreak,
    hStreak,
    ascent,
    heroCelebration,
    habits,
    photos,
    photoUrls,
    dailyLogs,
    habitLogs,
    workoutLogs,
    sessionCompletions,
    bounceBackHack,
    bounceBackTarget,
    onBounceDismiss,
    throttleActive,
    onThrottleDismiss,
    coachRecDelta,
    onSetTarget,
  } = view;

  return (
    <div className="hidden min-h-screen w-full justify-center px-8 py-8 lg:flex">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid w-full max-w-[1400px] grid-cols-12 gap-5"
      >
        <div className="col-span-12 flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Coach's Dashboard</p>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-light text-foreground/30">{format(new Date(), "EEEE · MMM d")}</p>
            <Link to="/coach" aria-label="AI Coach" className="text-foreground/45 transition-colors hover:text-foreground/80">
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
            <Link to="/settings" aria-label="Settings" className="text-foreground/45 transition-colors hover:text-foreground/80">
              <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {bounceBackHack && (
          <div className="col-span-12">
            <BounceBackCard hack={bounceBackHack} onDismiss={onBounceDismiss} />
          </div>
        )}

        {throttleActive && (
          <div className="col-span-12">
            <ThrottleCard onDismiss={onThrottleDismiss} />
          </div>
        )}

        {/* Phase progress — full-width band */}
        <div className="col-span-12">
          <PhaseHero phaseLabel={ascent.phaseLabel} stepLabel={ascent.stepLabel} pct={ascent.phasePct ?? 0} celebration={heroCelebration} />
        </div>

        {/* LEFT — Aesthetic Ascent, Trajectory, Consistency */}
        <div className="col-span-3 space-y-4">
          <AscentCard ascent={ascent} />

          <TrajectoryCard
            currentWeightKg={currentWeightKg}
            goalWeightKg={goalWeightKg}
            maintenance={maintenance}
            target={target}
            goal={goal}
            sex={profile.sex}
            coachRecDelta={coachRecDelta}
            onSetTarget={onSetTarget}
          />

          <ConsistencyCard
            dailyLogs={dailyLogs}
            habitLogs={habitLogs}
            workoutLogs={workoutLogs}
            habits={habits.map((h) => h.name)}
            profile={profile}
            sessionCompletions={sessionCompletions}
          />
        </div>

        {/* CENTER — weekly review */}
        <div className="col-span-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <CalorieCard
              intake={intake}
              target={target}
              maintenance={maintenance}
              goal={goal}
              protein={protein}
              proteinTarget={proteinTarget}
              bounceBackTarget={bounceBackTarget}
            />
            <WinTheWeekCard
              workoutPct={workoutPct}
              nutritionPct={trackedPct}
              habitPct={habitPct}
              streak={ww.streak ?? 0}
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <WeightTrendChart data={weightPoints} goal={goal} profile={profile} weighIns={weighIns} />
            </div>
            <WeeklyCaloriesCard dailyLogs={dailyLogs} target={target} proteinTarget={proteinTarget} />
          </div>
        </div>

        {/* RIGHT — habits, mirror, quick actions */}
        <div className="col-span-3 space-y-4">
          <HabitsCard habits={habits} />

          <MirrorCheckCard photos={photos} photoUrls={photoUrls} />

          <button
            onClick={onLogWeight}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-sm font-semibold text-primary-foreground glow-sm transition-all hover:glow-md"
          >
            <Scale className="h-4 w-4" strokeWidth={2} /> Log Weight
          </button>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <Link
              to="/fuel"
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-accent/30"
            >
              <span className="text-sm text-foreground/75">Log today</span>
              <ArrowUpRight className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
            </Link>
            <Link
              to="/train"
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-accent/30"
            >
              <span className="text-sm text-foreground/75">Today's session</span>
              <ArrowUpRight className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
            </Link>
            <Link
              to="/settings"
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-accent/30"
            >
              <span className="text-sm text-foreground/75">Settings</span>
              <ArrowUpRight className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}