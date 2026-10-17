import React, { useState } from "react";
import { db } from "@/api/db";
import { computeBaseline } from "@/lib/metabolism";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// "Adjust protein target" — shown inside the Metabolism Calibration card, only
// for a weight-loss goal. Displays the recommended daily protein target (live
// formula, no override) and lets the member set a custom target. Guardrails:
// 0.5–1.5 g per pound of current bodyweight. An out-of-range entry is refused
// with a dialog naming the actual min/max in grams. "Use recommended" clears
// protein_override_g back to null so the live formula takes over again.
export default function ProteinTargetSection({ profile, onSaved }) {
  const recommended = computeBaseline(profile).protein;
  const currentLb = (profile?.current_weight ?? 0) * 2.20462;
  const band = currentLb <= 200 ? { minPerLb: 0.7, maxPerLb: 2.0 } : { minPerLb: 0.5, maxPerLb: 1.5 };
  const minG = Math.round(band.minPerLb * currentLb);
  const maxG = Math.round(band.maxPerLb * currentLb);

  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [badValue, setBadValue] = useState(null);

  const override = Number.isFinite(profile?.protein_override_g) ? profile.protein_override_g : null;

  async function applyCustom() {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    if (n < minG || n > maxG) {
      setBadValue(n);
      setRangeOpen(true);
      return;
    }
    setSaving(true);
    try {
      const updated = await db.entities.Profile.update(profile.id, { protein_override_g: n });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      setValue("");
      onSaved?.(updated);
    } finally {
      setSaving(false);
    }
  }

  async function useRecommended() {
    setSaving(true);
    try {
      const updated = await db.entities.Profile.update(profile.id, { protein_override_g: null });
      onSaved?.(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Protein target</p>
        <p className="font-mono text-[11px] text-foreground/55">
          {override != null ? `Custom · ${override}g` : `Recommended · ${recommended}g`}
        </p>
      </div>

      <p className="mt-2 text-[11px] font-light leading-relaxed text-foreground/45">
        Recommended {recommended}g/day from your current weight. Set a custom target between {minG}g and {maxG}g ({band.minPerLb}–{band.maxPerLb} g/lb).
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={String(recommended)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
        />
        <button
          onClick={applyCustom}
          disabled={saving || value === ""}
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
        >
          {saving ? "Saving…" : "Apply"}
        </button>
      </div>

      {override != null && (
        <button
          onClick={useRecommended}
          disabled={saving}
          className="mt-2 text-[11px] font-light text-foreground/50 underline-offset-4 transition-colors hover:text-accent hover:underline disabled:opacity-40"
        >
          Use recommended
        </button>
      )}

      {saved && <p className="mt-2 text-[11px] font-light text-accent/80">Protein target saved ✓</p>}

      <Dialog open={rangeOpen} onOpenChange={setRangeOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Outside the optimal range</DialogTitle>
            <DialogDescription className="text-[13px] font-light leading-relaxed text-foreground/60">
              {badValue}g is outside the optimal range for you. For your current weight, keep your daily protein target between {minG}g and {maxG}g.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => setRangeOpen(false)}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}