import React, { useMemo, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";
import { deltaAppearance, deltaHex } from "@/lib/weightDelta";
import WeightUnitToggle from "@/components/fuel/WeightUnitToggle";
import { useWeightUnit } from "@/lib/weightUnitContext";
import WeightBaselineAck from "@/components/WeightBaselineAck";

const RANGES = [
  { key: "4w", label: "4W", days: 28 },
  { key: "3m", label: "3M", days: 84 },
  { key: "all", label: "All", days: Infinity },
];

// Centered rolling average over a 5-point window — the smoothed trend line is
// the visual hero; individual weigh-ins render as small points beneath it.
function rollingAvg(values, i, w = 5) {
  const half = Math.floor(w / 2);
  let s = 0;
  let c = 0;
  for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j++) {
    s += values[j];
    c++;
  }
  return +(s / c).toFixed(1);
}

export default function WeightTrendChart({ weighIns, profile }) {
  const [range, setRange] = useState("4w");
  const { unit, setUnit } = useWeightUnit();
  const lbl = unitLabel(unit);

  const goalVal = useMemo(() => {
    if (!profile?.current_weight) return null;
    const amt = profile.goal_amount || 0;
    let g = profile.current_weight;
    if (profile.goal === "lose") g -= amt;
    else if (profile.goal === "gain") g += amt;
    return kgToUnit(g, unit);
  }, [profile, unit]);

  const rows = useMemo(() => {
    const r = RANGES.find((x) => x.key === range) || RANGES[0];
    const cutoff = r.days === Infinity ? null : format(subDays(new Date(), r.days), "yyyy-MM-dd");
    return (weighIns || [])
      .filter((w) => w.date && typeof w.weight === "number")
      .filter((w) => !cutoff || w.date >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [weighIns, range]);

  const data = useMemo(() => {
    const uArr = rows.map((w) => kgToUnit(w.weight, unit));
    return rows.map((w, i) => ({
      label: format(parseISO(w.date), "M/d"),
      w: kgToUnit(w.weight, unit),
      trend: rollingAvg(uArr, i),
    }));
  }, [rows, unit]);

  const yDomain = useMemo(() => {
    const vals = data.map((d) => d.w).concat(goalVal != null ? [goalVal] : []);
    if (!vals.length) return [0, 10];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return [Math.floor(min - 3), Math.ceil(max + 3)];
  }, [data, goalVal]);

  // Weight-delta readout — shared helper drives color + glow; the trend line
  // itself stays neutral data.
  const change = data.length >= 2 ? +(data[data.length - 1].w - data[0].w).toFixed(1) : null;
  const deltaLbs = change === null ? 0 : unit === "lbs" ? change : change * 2.2046226218;
  const app = deltaAppearance({ profile, weighIns, deltaLbs });
  const deltaColor = deltaHex(app);
  const glow = app.glow;
  const sign = change !== null && change > 0 ? "+" : change !== null && change < 0 ? "−" : "";

  return (
    <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Weight trend</p>
          {change !== null && (
            <p
              className="mt-1 font-mono text-sm font-light leading-none"
              style={{ color: deltaColor, textShadow: glow }}
            >
              {sign}{Math.abs(change)} {lbl}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <WeightUnitToggle unit={unit} onChange={setUnit} />
          <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  range === r.key
                    ? "bg-accent/15 text-accent"
                    : "text-foreground/45 hover:text-foreground/70"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-xs font-light text-foreground/30">
          Not enough weigh-ins yet.
        </div>
      ) : data.length === 1 ? (
        <div className="mt-4 flex h-64 items-center justify-center">
          <WeightBaselineAck weightKg={rows[0].weight} dateStr={rows[0].date} unit={unit} />
        </div>
      ) : (
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => Math.round(v)}
              />
              {goalVal != null && (
                <ReferenceLine
                  y={goalVal}
                  stroke="hsl(193 100% 50%)"
                  strokeOpacity={0.35}
                  strokeDasharray="5 5"
                  style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.45))" }}
                  label={{
                    value: "goal",
                    fill: "hsl(193 100% 50%)",
                    fontSize: 9,
                    opacity: 0.6,
                    position: "insideTopRight",
                  }}
                />
              )}
              <Line
                dataKey="w"
                stroke="none"
                dot={{ r: 3, fill: "hsl(193 100% 50%)", fillOpacity: 0.45 }}
                activeDot={{ r: 4, fill: "hsl(193 100% 50%)" }}
              />
              <Line
                dataKey="trend"
                stroke="hsl(193 100% 50%)"
                strokeWidth={3}
                dot={false}
                style={{ filter: "drop-shadow(0 0 6px rgba(0,212,255,0.6))" }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(233 38% 7%)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                formatter={(v, n) => [`${v} ${lbl}`, n === "trend" ? "trend" : "weight"]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length >= 2 && (
        <p className="mt-3 text-center text-[11px] font-light text-foreground/35">
          The trend line is the story — daily noise fades.
        </p>
      )}
    </div>
  );
}