import React from "react";
import { format, parseISO } from "date-fns";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";
import { useWeightUnit } from "@/lib/weightUnitContext";

function Photo({ img, label }) {
  return (
    <div>
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {img ? (
          <img src={img} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <p className="mt-1.5 text-center text-[11px] font-light text-foreground/50">{label}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-mono text-lg font-light text-accent">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-foreground/40">{label}</p>
    </div>
  );
}

export default function Certificate({ photos, signedUrls, weeksTracked, wonWeeks, delta }) {
  const { unit } = useWeightUnit();
  const lbl = unitLabel(unit);
  const first = photos[photos.length - 1]; // oldest (list is -date)
  const latest = photos[0];
  return (
    <div className="rounded-3xl border border-accent/30 bg-gradient-to-b from-accent/[0.06] to-white/[0.02] p-6 glow-md">
      <p className="text-center text-[10px] uppercase tracking-[0.32em] text-accent">
        First Real Transformation
      </p>
      <h2 className="mt-3 text-center font-display text-2xl font-light text-foreground text-glow">
        Certified.
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Photo
          img={first && signedUrls[first.id]}
          label={first ? format(parseISO(first.date), "MMM yyyy") : "—"}
        />
        <Photo
          img={latest && signedUrls[latest.id]}
          label={latest ? format(parseISO(latest.date), "MMM yyyy") : "—"}
        />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="Weeks" value={weeksTracked} />
        <Stat label="Winning weeks" value={wonWeeks} />
        <Stat label="Weight" value={`${delta > 0 ? "+" : ""}${kgToUnit(delta, unit)} ${lbl}`} />
      </div>
      <p className="mt-5 text-center text-xs font-light text-foreground/45">
        The mirror and the numbers agree. This is real.
      </p>
    </div>
  );
}