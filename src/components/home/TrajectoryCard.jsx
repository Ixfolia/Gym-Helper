import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { addWeeks, format } from "date-fns";
import { useWeightUnit } from "@/lib/weightUnitContext";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";
import { ChevronDown } from "lucide-react";
import RecalibrateCard from "@/components/home/RecalibrateCard";
import AdjustTargetSection from "@/components/home/AdjustTargetSection";

// 6-month weight projection. Collapsed = faded teaser; expanded = projection
// chart driven by a two-path "Adjust target" flow: a recommended Sustainable
// Plan (from goalPacing) or a guarded manual entry reached after a coach
// conversation prompt. The line, caption, and sub-line update live in either
// path. Maintain goals hide the adjust block entirely.
const WEEKS = 26;

export default function TrajectoryCard({
  currentWeightKg,
  goalWeightKg,
  maintenance,
  target,
  goal,
  sex,
  coachRecDelta = 0,
  onSetTarget,
}) {
  const { unit } = useWeightUnit();
  const lbl = unitLabel(unit);
  const [open, setOpen] = useState(false);

  const hasData = currentWeightKg != null && maintenance != null && target != null;

  // Only lose/gain goals expose target adjustment.
  const adjustable = goal === "lose" || goal === "gain";

  // Manual-entry state is owned here (not in AdjustTargetSection) so the Vision
  // chart can preview the projection against the in-progress value live.
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTarget, setManualTarget] = useState(() => Math.round(target || 0));

  const [recalDismissed, setRecalDismissed] = useState(() => {
    try {
      return localStorage.getItem("peak.recalibrate.dismissedGoal") || "";
    } catch {
      return "";
    }
  });

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Trajectory</p>
        <p className="mt-3 font-display text-lg font-light text-foreground/70">The Vision</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">
          Set your weight + fuel target to see your 6-month line
        </p>
      </div>
    );
  }

  const startW = +kgToUnit(currentWeightKg, unit).toFixed(2);
  const goalW = goalWeightKg != null ? +kgToUnit(goalWeightKg, unit).toFixed(1) : null;

  // Live delta = the manual target while editing (empty field falls back to the
  // stored target so the projection never swings wild), else the stored delta.
  const activeTarget = manualOpen && manualTarget != null ? Number(manualTarget) : (target || 0);
  const liveDelta = Math.abs(activeTarget - (maintenance || 0));
  const dailyAdj = adjustable
    ? (goal === "gain" ? 1 : -1) * liveDelta
    : (target || 0) - (maintenance || 0);
  const weeklyChangeLb = (dailyAdj * 7) / 3500;
  const weeklyChange = unit === "kg" ? weeklyChangeLb / 2.20462 : weeklyChangeLb;

  const today = new Date();
  // First day of each of the next 6 calendar months, positioned at its
  // fractional week offset (days from today ÷ 7) within the 0–26 week domain.
  const monthTicks = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
    const days = Math.round((d - today) / 86400000);
    return { x: +(days / 7).toFixed(3), label: format(d, "MMM").toUpperCase() };
  });
  const pts = [];
  for (let i = 0; i <= WEEKS; i++) {
    pts.push({ week: i, w: +(startW + weeklyChange * i).toFixed(2) });
  }
  const endW = pts[WEEKS].w;

  let crossWeek = null;
  if (goalW != null && Math.abs(weeklyChange) > 1e-6) {
    const k = (goalW - startW) / weeklyChange;
    if (k >= 0 && k <= WEEKS) crossWeek = k;
  }

  const adjKcal = Math.round(liveDelta);
  const signedTotal = Math.round(weeklyChange * WEEKS);
  const changeStr = signedTotal > 0 ? `+${signedTotal}` : signedTotal < 0 ? `−${Math.abs(signedTotal)}` : `0`;
  const endDateLabel = format(addWeeks(today, WEEKS), "MMM d").toUpperCase();
  const unitUp = lbl.toUpperCase();
  // Outcome sub-line: goal-crossing date, distance to go, or holding steady.
  let subLine = null;
  if (goal === "maintain") {
    subLine = "HOLDING STEADY";
  } else if (goalW != null) {
    if (crossWeek != null) {
      subLine = `GOAL REACHED ≈ ${format(addWeeks(today, crossWeek), "MMM d").toUpperCase()}`;
    } else {
      subLine = `${Math.round(Math.abs(goalW - endW))} ${unitUp} TO GO AT 6 MONTHS`;
    }
  }

  // teaser preview polyline
  const ws = pts.map((p) => p.w);
  const minW = Math.min(...ws);
  const maxW = Math.max(...ws);
  const span = maxW - minW || 1;
  const poly = pts
    .map((p, i) => `${((i / WEEKS) * 100).toFixed(1)},${(30 - ((p.w - minW) / span) * 26 - 2).toFixed(1)}`)
    .join(" ");

  const vals = [startW, endW];
  if (goalW != null) vals.push(goalW);
  const yLo = Math.min(...vals) - 0.5;
  const yHi = Math.max(...vals) + 0.5;

  // Recalibrate nudge — goal more than 8 lbs past the max-pace 6-month endpoint.
  const startLbs = kgToUnit(currentWeightKg, "lbs");
  const goalLbs = goalWeightKg != null ? kgToUnit(goalWeightKg, "lbs") : null;
  const maxAdj = goal === "lose" ? 600 : goal === "gain" ? 500 : 0;
  const projectedEndLbs = startLbs + (goal === "gain" ? 1 : -1) * ((maxAdj * 7) / 3500) * WEEKS;
  const goalSig = `${goal}:${goalWeightKg != null ? goalWeightKg.toFixed(2) : "null"}`;
  const recalArmed = recalDismissed !== goalSig;
  let showRecalibrate = false;
  if (adjustable && goalLbs != null) {
    const gap = goal === "lose" ? projectedEndLbs - goalLbs : goalLbs - projectedEndLbs;
    showRecalibrate = gap > 8;
  }
  const showRecalCard = showRecalibrate && recalArmed;
  const handleKeepGoal = () => {
    try {
      localStorage.setItem("peak.recalibrate.dismissedGoal", goalSig);
    } catch {
      /* ignore */
    }
    setRecalDismissed(goalSig);
  };

  // Month axis ticks — uppercase mono micro-labels, no line/ticks/grid. A label
  // within ~1 week of the goal-crossing dot is skipped so the two never collide.
  const renderMonthTick = (props) => {
    const { x, y, payload } = props;
    const t = monthTicks.find((m) => Math.abs(m.x - payload.value) < 1e-6);
    if (!t) return null;
    if (crossWeek != null && Math.abs(t.x - crossWeek) < 1.0) return null;
    return (
      <text
        x={x}
        y={y}
        dy={6}
        textAnchor="middle"
        fill="currentColor"
        style={{ fontSize: 9, letterSpacing: "0.18em" }}
        className="text-foreground/40 font-mono"
      >
        {t.label}
      </text>
    );
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Trajectory</p>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="text-foreground/40 transition-colors hover:text-accent"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.75}
          />
        </button>
      </div>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {showRecalCard && (
            <div className="mb-3">
              <RecalibrateCard onKeep={handleKeepGoal} />
            </div>
          )}
          <h3 className="mt-3 font-display text-lg font-light text-foreground">The Vision</h3>
          <div className="mt-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pts} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                <defs>
                  <linearGradient id="trajStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(193 100% 50%)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="hsl(193 100% 50%)" stopOpacity={0.25} />
                  </linearGradient>
                  <linearGradient id="trajFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(193 100% 50%)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="hsl(193 100% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  type="number"
                  domain={[0, WEEKS]}
                  ticks={monthTicks.map((m) => m.x)}
                  axisLine={false}
                  tickLine={false}
                  tick={renderMonthTick}
                />
                <YAxis domain={[yLo, yHi]} hide />
                <Area
                  type="monotone"
                  dataKey="w"
                  stroke="url(#trajStroke)"
                  strokeWidth={2.5}
                  fill="url(#trajFill)"
                  dot={false}
                />
                {goalW != null && (
                  <ReferenceLine
                    y={goalW}
                    stroke="rgba(148,163,184,0.35)"
                    strokeWidth={1}
                    label={{
                      value: `${Math.round(goalW)}`,
                      fill: "rgba(148,163,184,0.7)",
                      fontSize: 10,
                      fontFamily: "IBM Plex Mono",
                      position: "insideTopRight",
                    }}
                  />
                )}
                {crossWeek != null && (
                  <ReferenceDot x={crossWeek} y={goalW} r={9} fill="#34D399" fillOpacity={0.18} stroke="none" />
                )}
                {crossWeek != null && (
                  <ReferenceDot
                    x={crossWeek}
                    y={goalW}
                    r={4.5}
                    fill="#34D399"
                    stroke="#34D399"
                    label={{
                      value: format(addWeeks(today, crossWeek), "MMM d"),
                      fill: "#34D399",
                      fontSize: 10,
                      fontFamily: "IBM Plex Mono",
                      position: "top",
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 font-mono text-[10px] tracking-wide text-foreground/55">
            IF YOU START TODAY AND HOLD {adjKcal} KCAL/DAY — {changeStr} {unitUp} BY {endDateLabel} → {Math.round(endW)} {unitUp}
          </p>
          {subLine && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
              {subLine}
            </p>
          )}

          <AdjustTargetSection
            maintenance={maintenance}
            target={target}
            goal={goal}
            sex={sex}
            goalWeightKg={goalWeightKg}
            currentWeightKg={currentWeightKg}
            coachRecDelta={coachRecDelta}
            onSetTarget={onSetTarget}
            manualOpen={manualOpen}
            setManualOpen={setManualOpen}
            manualTarget={manualTarget}
            setManualTarget={setManualTarget}
          />

          <p className="mt-3 font-mono text-[9px] text-foreground/30">
            Projection — refines as your maintenance calibrates with AM Coach.
          </p>
        </motion.div>
      ) : (
        <button onClick={() => setOpen(true)} className="mt-3 block w-full text-left">
          <svg viewBox="0 0 100 32" className="h-8 w-full" preserveAspectRatio="none">
            <polyline
              points={poly}
              fill="none"
              stroke="hsl(193 100% 50%)"
              strokeOpacity={0.4}
              strokeWidth={1.5}
            />
          </svg>
          <h3 className="mt-2 font-display text-lg font-light text-foreground">The Vision</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent/70">
            See your 6-month line
          </p>
        </button>
      )}

    </div>
  );
}