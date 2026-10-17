import React, { useEffect, useRef, useState } from "react";
import { useMotionValue, animate } from "framer-motion";
import { proteinStatus } from "@/lib/fuelColors";

// Protein progress indicator. Brand blue while below 70% today (a filling
// bar, no judgment), light green "near" from 70–100%, full green "met" at
// ≥100%. On a past day (dayComplete) below 70% reads amber. Never penalizes
// going over. Neutral slate before any protein is logged.
// On a meal op (animateNonce bump) the grams figure counts from the previous
// total to the new total over ~900ms ease-out; the bar animates to its new
// width over ~700ms. On a date switch the figure snaps.
export default function ProteinIndicator({ intake, target, dayComplete = false, animateNonce = 0, className = "" }) {
  const mv = useMotionValue(0);
  const [displayed, setDisplayed] = useState(() => Number(intake) || 0);
  const prevNonce = useRef(animateNonce);

  useEffect(() => {
    const newV = Number(intake) || 0;
    if (prevNonce.current !== animateNonce && animateNonce > 0) {
      prevNonce.current = animateNonce;
      const controls = animate(mv, newV, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate: (v) => setDisplayed(Math.round(v)),
      });
      return () => controls.stop();
    }
    prevNonce.current = animateNonce;
    mv.set(newV);
    setDisplayed(newV);
     
  }, [intake, animateNonce]);

  const s = proteinStatus({ intake, target, dayComplete });
  const tg = Number(target) || 0;
  const v = Number(intake) || 0;
  const width = tg > 0 ? Math.min(100, Math.max(2, Math.round((v / tg) * 100))) : 0;

  let label;
  if (v <= 0) {
    label = tg > 0 ? ` · target ${tg}g` : "";
  } else if (s.kind === "met") {
    label = " · target met";
  } else if (s.kind === "near") {
    label = " · almost there";
  } else {
    label = dayComplete ? ` · short of ${tg}g` : ` · of ${tg}g`;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Protein</p>
        <p className="text-[11px] font-light" style={{ color: s.hex }}>
          {displayed > 0 ? `${Math.round(displayed)}g` : "—"}
          {label}
        </p>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-[1400ms] ease-out"
          style={{ width: `${width}%`, backgroundColor: s.hex }}
        />
      </div>
    </div>
  );
}