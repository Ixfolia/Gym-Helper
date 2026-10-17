import React from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import WeightUnitToggle from "@/components/fuel/WeightUnitToggle";
import { useWeightUnit } from "@/lib/weightUnitContext";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";
import { deltaAppearance, deltaHex } from "@/lib/weightDelta";
import WeightBaselineAck from "@/components/WeightBaselineAck";

// Larger weight-trend chart for the desktop center panel — gradient area fill,
// current weight, and the period delta as the visual hero (green + glow when
// moving toward goal, amber when moving away). A dashed gold goal-weight line
// anchors the trend to the target. Same weigh-in data as the mobile sparkline.
export default function WeightTrendChart({ data, goal, profile, weighIns }) {
  const { unit, setUnit } = useWeightUnit();
  const lbl = unitLabel(unit);
  const uData = (data || []).map((d) => ({ ...d, w: kgToUnit(d.weight, unit) }));
  if (!data || data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs font-light text-foreground/30">
        Not enough weigh-ins yet.
      </div>
    );
  }
  if (data.length === 1) {
    return (
      <div className="flex h-44 items-center justify-center">
        <WeightBaselineAck weightKg={data[0].weight} dateStr={data[0].date} unit={unit} />
      </div>
    );
  }
  const weights = uData.map((d) => d.w);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const cur = weights[weights.length - 1];
  const start = weights[0];
  const change = +(cur - start).toFixed(1);

  // Weight-delta color doctrine v2 — shared helper drives color + glow.
  const deltaLbs = unit === "lbs" ? change : change * 2.2046226218;
  const app = deltaAppearance({ profile, weighIns, deltaLbs });
  const deltaColor = deltaHex(app);
  const glow = app.glow;
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";

  const lo = min - 0.5;
  const hi = max + 0.5;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.28em] text-foreground/35">Weight trend</p>
          <p className="mt-1 font-mono text-2xl font-light text-foreground">
            {cur} <span className="text-sm text-foreground/40">{lbl}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 font-mono">
          <WeightUnitToggle unit={unit} onChange={setUnit} />
          <p
            className="whitespace-nowrap text-[18px] font-light leading-none"
            style={{ color: deltaColor, textShadow: glow }}
          >
            {sign}{Math.abs(change)} {lbl}
          </p>
          <p className="text-[11px] text-foreground/45">
            {start} → {cur}
          </p>
        </div>
      </div>
      <div className="mt-3 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={uData} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="wtFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(193 100% 50%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(193 100% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[lo, hi]} hide />
            <Tooltip
              contentStyle={{
                background: "#0B0E18",
                border: "1px solid rgba(0,212,255,0.3)",
                borderRadius: 12,
                fontSize: 12,
                color: "#e6f0ff",
              }}
              labelStyle={{ display: "none" }}
              formatter={(v) => [`${v} ${lbl}`, ""]}
              cursor={{ stroke: "rgba(0,212,255,0.3)" }}
            />
            <Area
              type="monotone"
              dataKey="w"
              stroke="hsl(193 100% 50%)"
              strokeWidth={2.5}
              fill="url(#wtFill)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(193 100% 50%)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}