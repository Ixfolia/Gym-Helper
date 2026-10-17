import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subDays,
  addMonths,
} from "date-fns";
import { detectOutliers } from "@/lib/outliers";
import { dedupeByDate } from "@/lib/dedupe";
import NutritionStat from "@/components/home/NutritionStat";

// WEEKLY CALORIES v2 — two stats (avg calories + avg protein) over the current
// week's non-voided logged days. The big numbers use the same electric-blue
// glow treatment as the Win the Week score, always. Next to each, a
// parenthetical shows the delta from target in the green closeness glow the
// numbers used before — calories keeps its outlier-average amber rule, protein
// goes amber below 70% of target and full green at/above target. Collapsed view
// is a last-7-days strip (date numbers, same cell semantics); the chevron opens
// the full-month calendar. Tapping a day opens Fuel on that date. No red anywhere.
const AMBER = "#F5A623";
const WD = ["S", "M", "T", "W", "T", "F", "S"];
const GREEN = { 1: "#6EE7B7", 2: "#34D399", 3: "#34D399" };

function greenGlow(intensity) {
  if (intensity >= 3) return "0 0 18px rgba(52,211,153,0.5), 0 0 40px rgba(52,211,153,0.2)";
  if (intensity === 2) return "0 0 14px rgba(52,211,153,0.35)";
  return "none";
}

// Green deepens + glows as the average nears its target (same spirit as the
// weight-delta helper). Calories may flip to amber on an outlier average;
// protein never goes amber. Never red.
function statStyle(avg, target, allowAmber) {
  if (avg === null || avg === undefined) return { hex: GREEN[1], glow: "none" };
  const t = Number(target) || 0;
  if (allowAmber && t > 0 && (avg < 1000 || avg < 0.6 * t || avg > 1.6 * t)) {
    return { hex: AMBER, glow: "0 0 16px rgba(245,166,35,0.45)" };
  }
  if (t > 0) {
    const closeness = 1 - Math.min(1, Math.abs(avg - t) / t);
    const intensity = closeness >= 0.66 ? 3 : closeness >= 0.33 ? 2 : 1;
    return { hex: GREEN[intensity], glow: greenGlow(intensity) };
  }
  return { hex: GREEN[1], glow: "none" };
}

// Protein parenthetical: amber below 70% of target, the existing green
// closeness ramp from 70% up, and full green at/above target.
function proteinParenStyle(avg, target) {
  if (avg === null || avg === undefined) return { hex: GREEN[1], glow: "none" };
  const t = Number(target) || 0;
  if (t > 0 && avg < 0.7 * t) return { hex: AMBER, glow: "0 0 16px rgba(245,166,35,0.45)" };
  return statStyle(avg, target, false);
}

// Signed difference from target for the parenthetical, e.g. "(−389)" / "(+8g)".
function deltaParts(avg, target) {
  if (avg === null || avg === undefined) return { sign: "", abs: "0" };
  const t = Number(target) || 0;
  const d = avg - t;
  const sign = d > 0 ? "+" : d < 0 ? "−" : "";
  return { sign, abs: Math.round(Math.abs(d)).toLocaleString() };
}

function firstLoggedDateStr(logs) {
  const dates = (logs || [])
    .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0)
    .map((l) => l.date)
    .sort();
  return dates.length ? dates[0] : null;
}

function DayCell({ ds, state, todayCell }) {
  const dayNum = Number(ds.slice(-2));
  const future = state === "future";

  // Today is always a neutral in-progress cell: brand-blue outline, no fill,
  // never the amber outlier treatment — regardless of what's logged so far.
  // Completed days keep their coloring and outlier logic below.
  if (todayCell) {
    const cls =
      "relative flex aspect-square items-center justify-center rounded-[6px] text-[10px] font-light bg-transparent text-foreground/60 ring-1 ring-accent/70 transition-colors hover:ring-accent";
    return (
      <Link to={`/fuel?date=${ds}`} className={cls}>
        <span className="relative">{dayNum}</span>
      </Link>
    );
  }

  let fill = "bg-white/[0.05]";
  let text = "text-foreground/45";
  let strike = false;
  if (state === "voided") {
    fill = "bg-accent/35";
    text = "text-foreground/65";
    strike = true;
  } else if (state === "outlier") {
    fill = "bg-transparent";
    text = "text-foreground/95";
  } else if (state === "logged") {
    fill = "bg-accent/85";
    text = "text-primary-foreground";
  } else if (state === "future") {
    fill = "bg-transparent";
    text = "text-foreground/20";
  }

  const cls = `relative flex aspect-square items-center justify-center rounded-[6px] text-[10px] font-light ${fill} ${text} ${
    future ? "" : "transition-colors hover:brightness-110"
  }`;

  const inner = (
    <>
      {state === "outlier" && (
        <span className="absolute inset-0 rounded-[6px]" style={{ backgroundColor: AMBER }} />
      )}
      <span className={`relative ${strike ? "line-through decoration-foreground/50" : ""}`}>{dayNum}</span>
    </>
  );

  if (future) return <span className={cls}>{inner}</span>;
  return (
    <Link to={`/fuel?date=${ds}`} className={cls}>
      {inner}
    </Link>
  );
}

export default function WeeklyCaloriesCard({ dailyLogs, target, proteinTarget }) {
  const [expanded, setExpanded] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const { avgCal, avgProtein, loggedSet, voidedSet, outlierSet, firstDateStr } = useMemo(() => {
    const logs = dedupeByDate(dailyLogs || []);
    const loggedSet = new Set(
      logs.filter((l) => l.date && typeof l.calories === "number" && l.calories > 0).map((l) => l.date)
    );
    const voidedSet = new Set(logs.filter((l) => l.voided && l.date).map((l) => l.date));
    const { outliers } = detectOutliers(logs);
    const outlierSet = new Set(outliers.map((o) => o.log.date));
    const firstDateStr = firstLoggedDateStr(logs);

    const dow = today.getDay();
    const weekStart = subDays(today, dow);
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    // Completed days only — today never enters the averages; the moment the
    // day rolls over it counts.
    const weekLogs = logs.filter(
      (l) =>
        l.date >= weekStartStr &&
        l.date < todayStr &&
        !l.voided &&
        typeof l.calories === "number" &&
        l.calories > 0
    );
    const avgCal = weekLogs.length
      ? Math.round(weekLogs.reduce((s, l) => s + l.calories, 0) / weekLogs.length)
      : null;
    const avgProtein = weekLogs.length
      ? Math.round(weekLogs.reduce((s, l) => s + (l.protein || 0), 0) / weekLogs.length)
      : null;
    return { avgCal, avgProtein, loggedSet, voidedSet, outlierSet, firstDateStr };
     
  }, [dailyLogs]);

  function stateFor(ds) {
    if (voidedSet.has(ds)) return "voided";
    if (outlierSet.has(ds)) return "outlier";
    if (loggedSet.has(ds)) return "logged";
    return "unlogged";
  }

  // The big numbers are always electric-blue (Win the Week treatment); the
  // parenthetical delta carries the green/amber closeness logic the numbers
  // used before. Calories keeps its outlier-average amber rule; protein adds
  // amber below 70% of target and full green at/above target.
  const calStyle = statStyle(avgCal, target, true);
  const proStyle = proteinParenStyle(avgProtein, proteinTarget);
  const calDelta = deltaParts(avgCal, target);
  const proDelta = deltaParts(avgProtein, proteinTarget);

  // Collapsed: last 7 days strip (rolling window ending today).
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), "yyyy-MM-dd"));

  // Expanded: full month grid.
  const expStart = startOfMonth(monthCursor);
  const expEnd = endOfMonth(monthCursor);
  const expDays = eachDayOfInterval({ start: expStart, end: expEnd });
  const expLead = getDay(expStart);

  const monthOutlierCount = useMemo(() => {
    const prefix = format(monthCursor, "yyyy-MM");
    let n = 0;
    outlierSet.forEach((ds) => {
      if (ds.startsWith(prefix)) n++;
    });
    return n;
  }, [outlierSet, monthCursor]);

  const firstMonth = firstDateStr ? startOfMonth(new Date(firstDateStr + "T12:00:00")) : null;
  const currentMonth = startOfMonth(today);
  const prevDisabled = !firstMonth || monthCursor <= firstMonth;
  const nextDisabled = monthCursor >= currentMonth;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-accent/30">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-foreground/40">Weekly nutrition</p>
        <ChevronDown
          className={`h-4 w-4 text-foreground/40 transition-transform ${expanded ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </button>

      {/* Two stats — avg calories + avg protein */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-foreground/35">Avg calories</p>
          <NutritionStat
            big={avgCal !== null ? avgCal.toLocaleString() : "—"}
            paren={avgCal !== null ? `(${calDelta.sign}${calDelta.abs})` : null}
            color={calStyle.hex}
            glow={calStyle.glow}
          />
          <p className="mt-1.5 text-[10px] font-light text-foreground/40">
            {Number(target) ? `target ${Math.round(Number(target)).toLocaleString()} cal` : "set target in Fuel"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-foreground/35">Avg protein</p>
          <NutritionStat
            big={avgProtein !== null ? avgProtein.toLocaleString() : "—"}
            paren={avgProtein !== null ? `(${proDelta.sign}${proDelta.abs}g)` : null}
            color={proStyle.hex}
            glow={proStyle.glow}
          />
          <p className="mt-1.5 text-[10px] font-light text-foreground/40">
            {Number(proteinTarget) ? `target ${Math.round(Number(proteinTarget))} g` : "—"}
          </p>
        </div>
      </div>

      {!expanded ? (
        <div className="mt-4 grid grid-cols-7 gap-[3px]">
          {last7.map((ds) => (
            <DayCell key={ds} ds={ds} state={stateFor(ds)} todayCell={ds === todayStr} />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMonthCursor((m) => addMonths(m, -1))}
              disabled={prevDisabled}
              aria-label="Previous month"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-foreground/55 transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-foreground/55"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <p className="font-mono text-xs text-foreground/70">{format(monthCursor, "MMMM yyyy")}</p>
            <button
              onClick={() => setMonthCursor((m) => addMonths(m, 1))}
              disabled={nextDisabled}
              aria-label="Next month"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-foreground/55 transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-foreground/55"
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {monthOutlierCount > 0 && (
            <p className="mt-2 text-center text-[10px] font-light text-foreground/40">
              {monthOutlierCount} outlier {monthOutlierCount === 1 ? "day" : "days"} this month
            </p>
          )}

          <div className="mt-3 grid grid-cols-7 gap-[3px]">
            {WD.map((d, i) => (
              <span key={i} className="text-center text-[9px] font-light text-foreground/30">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-7 gap-[3px]">
            {Array.from({ length: expLead }, (_, i) => (
              <span key={`b${i}`} className="aspect-square" />
            ))}
            {expDays.map((d) => {
              const ds = format(d, "yyyy-MM-dd");
              const future = ds > todayStr;
              return (
                <DayCell
                  key={ds}
                  ds={ds}
                  state={future ? "future" : stateFor(ds)}
                  todayCell={ds === todayStr}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}