import React, { useEffect, useRef, useState } from "react";
import { useMotionValue, animate } from "framer-motion";
import { calorieStatus, FUEL_COLORS } from "@/lib/fuelColors";
import FuelDelta from "@/components/fuel/FuelDelta";
import ProteinIndicator from "@/components/fuel/ProteinIndicator";

const GOLD = "#E8B44A";

// Dual calorie/protein gauge. The big calorie number is ALWAYS the brand-blue
// glow — never colored by status. The signed delta sits beneath it in the
// status color. On a meal add/edit/delete (animateNonce bump) the big number
// counts from the previous total to the new total over ~900ms ease-out; the
// status parenthetical updates only when the count lands. The bar fill and
// marker dot transition to their new widths over ~700ms. On a date switch
// (nonce unchanged) the number snaps to the new day's total.
export default function DualGauge({
  intake,
  maintenance,
  target,
  goal,
  protein,
  proteinTarget,
  bounceBack,
  dayComplete = false,
  animateNonce = 0,
}) {
  const mv = useMotionValue(0);
  const [displayed, setDisplayed] = useState(() => Number(intake) || 0);
  const [statusIntake, setStatusIntake] = useState(() => Number(intake) || 0);
  const prevNonce = useRef(animateNonce);

  useEffect(() => {
    const newIntake = Number(intake) || 0;
    if (prevNonce.current !== animateNonce && animateNonce > 0) {
      prevNonce.current = animateNonce;
      const controls = animate(mv, newIntake, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate: (v) => setDisplayed(Math.round(v)),
        onComplete: () => setStatusIntake(newIntake),
      });
      return () => controls.stop();
    }
    prevNonce.current = animateNonce;
    mv.set(newIntake);
    setDisplayed(newIntake);
    setStatusIntake(newIntake);
     
  }, [intake, animateNonce]);

  const value = Number(intake) || 0;
  const scaleMax = Math.max(maintenance, target, bounceBack?.target || 0) * 1.4;
  const pct = (v) => Math.max(0, Math.min(100, (v / scaleMax) * 100));
  const intakePct = pct(value);
  const maintPct = pct(maintenance);
  const targetPct = pct(target);
  const bbPct = bounceBack ? pct(bounceBack.target) : null;
  const sameAnchor = maintenance === target;
  const clampLabel = (p) => Math.max(14, Math.min(86, p));
  const statusNow = calorieStatus({ goal, intake: value, target, maintenance, dayComplete });
  const statusLanded = calorieStatus({ goal, intake: statusIntake, target, maintenance, dayComplete });
  const celebrating = !!(bounceBack && value > 0 && value <= bounceBack.target);
  const barColor = celebrating ? FUEL_COLORS.green : statusNow ? statusNow.hex : FUEL_COLORS.slate;

  const deltaSign = statusLanded && statusLanded.delta > 0 ? "+" : statusLanded && statusLanded.delta < 0 ? "−" : "";
  const deltaLabel = statusLanded ? `(${deltaSign}${Math.round(Math.abs(statusLanded.delta)).toLocaleString()})` : "";
  const deltaGlow = statusLanded
    ? { textShadow: `0 0 ${10 + statusLanded.intensity * 22}px ${statusLanded.hex}cc, 0 0 ${4 + statusLanded.intensity * 10}px ${statusLanded.hex}66` }
    : null;

  return (
    <div>
      <div className="flex flex-col items-center pt-2">
        <span
          className={`font-display text-[4.5rem] font-extralight leading-none ${displayed ? "text-glow" : "text-foreground/15"}`}
          style={displayed ? { color: FUEL_COLORS.blue } : undefined}
        >
          {displayed ? displayed.toLocaleString() : "—"}
        </span>
        {statusLanded && (
          <span
            className="mt-1 font-mono text-[1rem] leading-none"
            style={{ color: statusLanded.hex, ...deltaGlow }}
          >
            {deltaLabel}
          </span>
        )}
        <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-foreground/40">calories today</span>
      </div>

      <div className="relative mt-8 h-8">
        <div
          className="absolute -translate-x-1/2 text-center"
          style={{ left: `${clampLabel(maintPct)}%` }}
        >
          <p className="text-[9px] uppercase tracking-[0.18em] text-foreground/45">Maintenance</p>
          <p className="text-[11px] font-mono text-foreground/70">{maintenance.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative h-2.5 rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-[1400ms] ease-out"
          style={{
            width: `${intakePct}%`,
            backgroundColor: barColor,
            ...(celebrating ? { boxShadow: `0 0 16px ${GOLD}, 0 0 30px ${GOLD}66` } : {}),
          }}
        />
        <div
          className="absolute -top-1.5 -bottom-1.5 w-[2px] -translate-x-1/2 bg-foreground/45"
          style={{ left: `${maintPct}%` }}
        />
        {!sameAnchor && (
          <div
            className="absolute -top-1.5 -bottom-1.5 w-[2px] -translate-x-1/2 bg-accent/70"
            style={{ left: `${targetPct}%` }}
          />
        )}
        {bounceBack && (
          <div
            className="absolute -top-1.5 -bottom-1.5 w-[2px] -translate-x-1/2"
            style={{ left: `${bbPct}%`, backgroundColor: GOLD, boxShadow: `0 0 8px ${GOLD}` }}
          />
        )}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-background glow-md transition-all duration-[1400ms] ease-out"
          style={{ left: `${intakePct}%` }}
        />
      </div>

      {(!sameAnchor || bounceBack) && (
        <div className="relative mt-2 h-8">
          {bounceBack && (
            <div
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${clampLabel(bbPct)}%` }}
            >
              <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
                Bounce-back
              </p>
              <p className="text-[11px] font-mono" style={{ color: GOLD }}>
                {bounceBack.target.toLocaleString()}
              </p>
            </div>
          )}
          {!sameAnchor && (
            <div
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${clampLabel(targetPct)}%` }}
            >
              <p className="text-[9px] uppercase tracking-[0.18em] text-accent/70">Target</p>
              <p className="text-[11px] font-mono text-foreground/70">{target.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      <FuelDelta goal={goal} intake={intake} target={target} maintenance={maintenance} className="mt-2 text-center" />
      {proteinTarget ? (
        <ProteinIndicator intake={protein} target={proteinTarget} dayComplete={dayComplete} animateNonce={animateNonce} className="mt-4" />
      ) : null}
    </div>
  );
}