import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { db } from "@/api/db";
import { detectOutliers } from "@/lib/outliers";
import { dedupeByDate } from "@/lib/dedupe";
import { deleteWeekSummaryForDate } from "@/lib/weeklySummarySync";

// Self-contained Outlier Days review. Fetches its own log history, flags
// outliers + shows already-voided days, and lets the member void/unvoid in
// place. Renders only when there's at least one outlier or voided day.
export default function ReviewDays({ onChanged }) {
  const [logs, setLogs] = useState([]);
  const refresh = useCallback(async () => {
    try {
      setLogs(dedupeByDate(await db.entities.DailyLog.list("-date", 120)));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const { outliers, voided, hasAny } = useMemo(() => detectOutliers(logs), [logs]);

  async function toggleVoid(log, toVoid) {
    try {
      await db.entities.DailyLog.update(log.id, { voided: toVoid });
      // A past day's quarantine changed — delete that week's grade so the next
      // load regrades it.
      deleteWeekSummaryForDate(log.date);
      onChanged?.();
    } finally {
      refresh();
    }
  }

  if (!hasAny) return null;

  const cards = [
    ...voided.map((l) => ({ log: l, voided: true, pctOfMean: null, underFloor: false })),
    ...outliers.map((o) => ({
      log: o.log,
      voided: false,
      pctOfMean: o.pctOfMean,
      underFloor: o.underFloor,
    })),
  ].sort((a, b) => (b.log.date || "").localeCompare(a.log.date || ""));

  return (
    <div className="mt-7">
      <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Review Days</p>
      <p className="mt-2 text-xs font-light leading-relaxed text-foreground/45">
        Days that look off — a forgotten meal, an extra zero. If the number's wrong, void it. If you
        really ate it, keeping it is the honest move.
      </p>
      <div className="mt-3 space-y-2.5">
        {cards.map((c) => {
          const pctText =
            c.pctOfMean != null
              ? c.pctOfMean < 100
                ? `${100 - c.pctOfMean}% below your average`
                : `${c.pctOfMean - 100}% above your average`
              : c.underFloor
              ? "Under 1,000 cal"
              : "";
          return (
            <div
              key={c.log.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground/80">
                    {format(parseISO(c.log.date), "EEE, MMM d")}
                  </p>
                  <p className="mt-0.5 text-[11px] font-light text-foreground/45">
                    {Math.round(c.log.calories).toLocaleString()} cal
                    {pctText ? ` · ${pctText}` : ""}
                  </p>
                </div>
                {c.voided ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-accent/30 bg-accent/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-accent/80">
                      Voided
                    </span>
                    <button
                      onClick={() => toggleVoid(c.log, false)}
                      className="rounded-xl border border-white/15 bg-white/[0.02] px-3 py-1.5 text-xs text-foreground/70 transition-all hover:border-accent/30"
                    >
                      Unvoid
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleVoid(c.log, true)}
                    className="rounded-xl border border-white/15 bg-white/[0.02] px-3 py-1.5 text-xs text-foreground/70 transition-all hover:border-accent/30"
                  >
                    Void
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}