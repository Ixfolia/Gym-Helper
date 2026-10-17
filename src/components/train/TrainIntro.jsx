import React, { useState } from "react";
import { db } from "@/api/db";
import { getTrack, COACH_NOTE } from "@/lib/splits";
import { Loader2 } from "lucide-react";

const options = [
  { cadence: "3-5", label: "3-5 days", sub: "Elite 3-5 Day Aesthetic Split" },
  { cadence: "4-6", label: "4-6 days", sub: "Peak Aesthetic Split (4-6 Day)" },
];

export default function TrainIntro({ onSaved }) {
  const [saving, setSaving] = useState(null);

  async function choose(cadence) {
    setSaving(cadence);
    try {
      const profile = await db.entities.Profile.create({
        cadence,
        track: getTrack(cadence),
      });
      onSaved(profile);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-32 pt-14">
      <p className="text-[10px] uppercase tracking-[0.32em] text-foreground/40">Train</p>
      <h1 className="mt-3 font-display text-[2rem] font-light leading-tight tracking-tight text-foreground">
        Let's match your split.
      </h1>

      <div className="mt-10 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <p className="text-[10px] uppercase tracking-[0.28em] text-accent/70">Coach's note</p>
        <p className="mt-4 text-sm font-light leading-relaxed text-foreground/60">
          {COACH_NOTE}
        </p>
      </div>

      <p className="mt-10 text-lg font-light leading-relaxed text-foreground/80">
        How many days can you realistically train most weeks?
      </p>

      <div className="mt-6 space-y-3">
        {options.map((o) => (
          <button
            key={o.cadence}
            onClick={() => choose(o.cadence)}
            disabled={!!saving}
            className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 text-left transition-all duration-300 hover:border-accent/40 hover:bg-accent/[0.04] disabled:opacity-50"
          >
            <div>
              <p className="text-base text-foreground">{o.label}</p>
              <p className="mt-1 text-xs font-light text-foreground/40">{o.sub}</p>
            </div>
            {saving === o.cadence ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-foreground/20 transition-colors group-hover:bg-accent group-hover:glow-sm" />
            )}
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-xs font-light leading-relaxed text-foreground/35">
        Lighter weeks are on-plan — retargeting days are your flex days.
      </p>
    </div>
  );
}