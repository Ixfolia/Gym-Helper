import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/api/db";
import { format } from "date-fns";
import { Scale, ArrowUpRight } from "lucide-react";
import { unitToKg, unitLabel } from "@/lib/weightUnits";
import { useWeightUnit } from "@/lib/weightUnitContext";

const DAY_MAP = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

export default function WeighIn({ profile, weighIns, onLogged }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayKey = DAY_MAP[new Date().getDay()];
  const isWeighInDay = profile?.weigh_in_day && todayKey === profile.weigh_in_day;
  const alreadyLogged = weighIns.some((w) => w.date === todayStr);
  const thisKey = format(new Date(), "yyyy-MM");
  const weighInThisMonth = weighIns.some((w) => w.date && w.date.startsWith(thisKey));
  const [val, setVal] = useState(null);
  const [saving, setSaving] = useState(false);
  const { unit } = useWeightUnit();
  const lbl = unitLabel(unit);

  async function save() {
    if (!val) return;
    setSaving(true);
    try {
      const kg = unitToKg(val, unit);
      await db.entities.WeighIn.create({ date: todayStr, weight: kg });
      setVal(null);
      onLogged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-10">
      {isWeighInDay && !alreadyLogged && (
        <div className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <p className="text-[10px] uppercase tracking-[0.28em] text-accent/80">Weigh-in day</p>
          </div>
          <p className="mt-2 text-sm font-light leading-relaxed text-foreground/70">
            A gentle nudge — log your weight when you're ready.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 transition-colors focus-within:border-accent/50">
              <input
                type="number"
                inputMode="decimal"
                value={val ?? ""}
                onChange={(e) => setVal(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="0.0"
                className="w-full bg-transparent py-3.5 text-2xl font-light text-foreground outline-none placeholder:text-foreground/20"
              />
              <span className="shrink-0 text-sm text-foreground/40">{lbl}</span>
            </div>
            <button
              onClick={save}
              disabled={!val || saving}
              className="rounded-2xl bg-accent px-5 py-3.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
            >
              {saving ? "…" : "Log"}
            </button>
          </div>
        </div>
      )}

      {weighInThisMonth && (
        <Link
          to="/mirror"
          className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-accent/30"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Mirror Check</p>
            <p className="mt-0.5 text-sm font-light text-foreground/65">
              The mirror tells the truth across months, not weeks.
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-foreground/40" strokeWidth={1.5} />
        </Link>
      )}

    </div>
  );
}