import React from "react";
import { Link } from "react-router-dom";
import { calorieStatus, proteinStatus, FUEL_COLORS } from "@/lib/fuelColors";

// "Today's Fuel" — two stacked fuel-cell capsule bars.
//  • Calories: 10 segmented cells filling with intake; color follows the
//    semantic state (green/amber/amber→red). TARGET + MAINT tick markers above
//    the bar (slate); a gold BOUNCE-BACK tick appears when a bounce-back day is
//    active. Bar scale = max(target, maintenance) × 1.15 so both ticks sit
//    inside the bar and the fill reaches the TARGET tick at intake = target.
//  • Protein: 10 cells filling toward the protein target; brand blue below 100%,
//    all green at 100%.
//  • Delta chip in the semantic state color + a calm supportive slate microcopy.
const GOLD = "#E8B44A";
const CELL_EMPTY_BG = "#16233B";
const BAR_BORDER = "rgba(30,155,255,0.35)";
const BAR_H = "0.875rem"; // 14px capsule

function supportMicrocopy(status, goal) {
  if (!status) return "Log your meals to watch the cells light up.";
  if (status.kind === "in") return "Right in the growth band — keep going.";
  if (status.kind === "under" && goal === "gain")
    return "Add a meal — you're building, not failing.";
  if (status.kind === "under") return "Steady — keep the rhythm.";
  return "One meal at a time — the week absorbs a big day.";
}

function CellBar({ filled, hex }) {
  return (
    <div
      className="flex items-stretch gap-[3px] rounded-full p-[3px]"
      style={{ height: BAR_H, backgroundColor: CELL_EMPTY_BG, border: `1px solid ${BAR_BORDER}` }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-full"
          style={{ backgroundColor: i < filled ? hex : "transparent" }}
        />
      ))}
    </div>
  );
}

export default function CalorieCard({
  intake,
  target,
  maintenance,
  goal,
  protein,
  proteinTarget,
  bounceBackTarget = null,
}) {
  const t = Math.max(1, Number(target) || 0);
  const m = Number(maintenance) || 0;
  const v = Number(intake) || 0;
  const status = calorieStatus({ goal, intake, target, maintenance });

  const maxScale = Math.max(t, m) * 1.15 || 1;
  const pctOf = (n) => Math.max(0, Math.min(100, ((Number(n) || 0) / maxScale) * 100));
  const fillHex = status ? status.hex : FUEL_COLORS.blue;
  const calFilled = Math.max(0, Math.min(10, Math.round((v / maxScale) * 10)));

  const pTarget = Math.max(1, Number(proteinTarget) || 0);
  const pStatus = proteinStatus({ intake: protein, target: proteinTarget });
  const pRatio = Math.min(1, (Number(protein) || 0) / pTarget);
  const pFilled = Number(protein) > 0 ? (pRatio >= 1 ? 10 : Math.floor(pRatio * 10)) : 0;
  const pHex = pStatus.hex;

  const ticks = [
    { label: "TARGET", pct: pctOf(t), color: FUEL_COLORS.slate, subtle: true },
    { label: "MAINT", pct: pctOf(m), color: FUEL_COLORS.slate, subtle: true },
  ];
  if (Number.isFinite(Number(bounceBackTarget)) && Number(bounceBackTarget) > 0) {
    ticks.push({ label: "BOUNCE-BACK", pct: pctOf(bounceBackTarget), color: GOLD, subtle: false });
  }
  ticks.sort((a, b) => a.pct - b.pct);

  // When TARGET and MAINT sit within 10% of the bar width, their labels would
  // overlap — merge into one centered "TARGET · MAINT" label. Marks stay put.
  const targetTick = ticks.find((tk) => tk.label === "TARGET");
  const maintTick = ticks.find((tk) => tk.label === "MAINT");
  const combineLabels =
    !!targetTick && !!maintTick && Math.abs(targetTick.pct - maintTick.pct) <= 10;
  const combinedPct = combineLabels ? (targetTick.pct + maintTick.pct) / 2 : null;
  const labelItems = combineLabels
    ? [
        { label: "TARGET · MAINT", pct: combinedPct, color: FUEL_COLORS.slate, subtle: true },
        ...ticks.filter((tk) => tk.label === "BOUNCE-BACK"),
      ]
    : ticks;

  const micro = supportMicrocopy(status, goal);

  return (
    <Link
      to="/fuel"
      className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-accent/30"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Today's fuel</p>
          <p
            className="mt-1.5 font-mono text-[1.5rem] font-medium leading-none"
            style={{ color: status ? status.hex : FUEL_COLORS.slate }}
          >
            {v.toLocaleString()}
          </p>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
          / {t.toLocaleString()} kcal
        </p>
      </div>

      {/* Calorie fuel cells */}
      <div className="mt-4">
        <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-foreground/40">Calories</p>
        <div className="relative mt-2">
          <div className="relative h-5">
            {/* Tick marks — always render at their exact positions */}
            {ticks.map((tk) => (
              <span
                key={`mark-${tk.label}`}
                className="absolute bottom-0 h-1.5 w-px -translate-x-1/2"
                style={{ left: `${tk.pct}%`, background: tk.color, opacity: tk.subtle ? 0.55 : 0.9 }}
              />
            ))}
            {/* Tick labels (merged into one when TARGET + MAINT overlap) */}
            {labelItems.map((tk) => (
              <div
                key={`label-${tk.label}`}
                className="absolute bottom-2 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${tk.pct}%` }}
              >
                <span
                  className="whitespace-nowrap text-[8px] font-mono uppercase tracking-[0.1em]"
                  style={{ color: tk.color, opacity: tk.subtle ? 0.85 : 1 }}
                >
                  {tk.label}
                </span>
              </div>
            ))}
          </div>
          <CellBar filled={calFilled} hex={fillHex} />
        </div>
      </div>

      {/* Protein fuel cells */}
      {Number(proteinTarget) > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-foreground/40">Protein</p>
            <p className="text-[10px] font-mono text-foreground/50">
              {Math.round(Number(protein) || 0)}g / {Math.round(pTarget)}g
            </p>
          </div>
          <div className="mt-1.5">
            <CellBar filled={pFilled} hex={pHex} />
          </div>
        </div>
      )}

      {/* Delta chip + supportive microcopy */}
      <div className="mt-4">
        {status ? (
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-mono"
            style={{ borderColor: `${status.hex}55`, color: status.hex }}
          >
            {status.text}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-mono text-foreground/50">
            No fuel logged yet
          </span>
        )}
        <p className="mt-2 text-[11px] font-light leading-snug text-foreground/45">{micro}</p>
      </div>
    </Link>
  );
}