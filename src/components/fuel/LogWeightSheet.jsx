import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { db } from "@/api/db";
import { X, Scale, Trash2 } from "lucide-react";
import { kgToUnit, unitToKg, unitLabel } from "@/lib/weightUnits";
import { useWeightUnit } from "@/lib/weightUnitContext";

// Simple weight entry in lbs, defaulting to today. One tap saves (creating or
// updating today's WeighIn record); today's entry can be deleted. Stores kg
// so the winning-week logic reads the same source of truth.
export default function LogWeightSheet({ open, onClose, weighIns, profile, onSaved }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const { unit } = useWeightUnit();
  const lbl = unitLabel(unit);

  useEffect(() => {
    if (!open) return;
    const list = (weighIns || []).filter((w) => typeof w.weight === "number");
    const existing = list.find((w) => w.date === todayStr);
    if (existing) {
      setVal(String(kgToUnit(existing.weight, unit)));
      return;
    }
    const last = [...list].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (last) {
      setVal(String(kgToUnit(last.weight, unit)));
      return;
    }
    if (profile?.current_weight) {
      setVal(String(kgToUnit(profile.current_weight, unit)));
      return;
    }
    setVal("");
  }, [open, unit]);  

  if (!open) return null;

  const existing = (weighIns || []).find((w) => w.date === todayStr);

  async function save() {
    const n = Number(val);
    if (!n || n <= 0) return;
    setBusy(true);
    try {
      const kg = unitToKg(n, unit);
      if (existing) {
        await db.entities.WeighIn.update(existing.id, { weight: kg });
      } else {
        await db.entities.WeighIn.create({ date: todayStr, weight: kg });
      }
      onSaved?.();
      onClose?.();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setBusy(true);
    try {
      await db.entities.WeighIn.delete(existing.id);
      onSaved?.();
      onClose?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-background p-5 pb-8 sm:rounded-3xl"
      >
        <button onClick={onClose} className="absolute right-4 top-4">
          <X className="h-5 w-5 text-foreground/40 hover:text-foreground/70" />
        </button>
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Log Weight</p>
        </div>
        <p className="mt-1 text-sm font-light text-foreground/60">{format(new Date(), "EEEE, MMM d")}</p>

        <div className="mt-5 flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 transition-colors focus-within:border-accent/50">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent py-4 text-3xl font-light text-foreground outline-none placeholder:text-foreground/20"
          />
          <span className="shrink-0 text-sm text-foreground/40">{lbl}</span>
        </div>

        <button
          onClick={save}
          disabled={busy || !val || Number(val) <= 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-medium text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
        >
          {busy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
          ) : existing ? (
            "Update"
          ) : (
            "Save"
          )}
        </button>

        {existing && (
          <button
            onClick={remove}
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-light text-foreground/40 transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Delete today's entry
          </button>
        )}
      </motion.div>
    </div>
  );
}