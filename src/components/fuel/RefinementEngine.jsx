import React, { useState } from "react";
import { db } from "@/api/db";
import { format } from "date-fns";
import { computeRefinement, computeManualRefinement } from "@/lib/metabolism";
import { Sparkles, ArrowRight, X } from "lucide-react";

export default function RefinementEngine({ logs, weighIns, offer, onSaved }) {
  const [mode, setMode] = useState("idle");
  const [work, setWork] = useState(null);
  const [missing, setMissing] = useState(null);
  const [manual, setManual] = useState({ avg: "", change: "" });
  const [manualResult, setManualResult] = useState(null);

  function refineFromLogs() {
    const r = computeRefinement(logs, weighIns);
    if (r.eligible) {
      setWork(r);
      setMode("work");
    } else {
      setMissing(r.missing);
      setMode("missing");
    }
  }

  async function confirm(value, source) {
    setMode("saving");
    try {
      await db.entities.MaintenanceHistory.create({
        date: format(new Date(), "yyyy-MM-dd"),
        value,
        source,
      });
      setMode("done");
      onSaved();
    } catch {
      setMode("idle");
    }
  }

  function computeManual() {
    if (!manual.avg || manual.change === "") return;
    setManualResult(computeManualRefinement(manual.avg, manual.change));
  }

  if (mode === "done") {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/[0.05] p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-accent" strokeWidth={1.75} />
        <p className="mt-3 text-base font-light text-foreground">Most people guess forever. You KNOW.</p>
        <button onClick={() => setMode("idle")} className="mt-4 text-xs text-foreground/45 transition-colors hover:text-accent">
          Done
        </button>
      </div>
    );
  }

  if (mode === "work" && work) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Here's the work</p>
          <button onClick={() => setMode("idle")}>
            <X className="h-4 w-4 text-foreground/30 hover:text-foreground/60" />
          </button>
        </div>
        <div className="mt-4 space-y-2 text-sm font-light text-foreground/70">
          <p>
            You averaged <span className="font-mono text-foreground">{work.avgCalories.toLocaleString()}</span> cal/day.
          </p>
          <p>
            Weight moved{" "}
            <span className="font-mono text-foreground">
              {work.weeklyChangeLbs > 0 ? "+" : ""}
              {work.weeklyChangeLbs}
            </span>{" "}
            lbs/week.
          </p>
          <p className="flex items-center gap-2 pt-1">
            So your data says <ArrowRight className="h-3.5 w-3.5 text-accent" />
            <span className="font-display text-2xl text-accent text-glow">
              {work.trueMaintenance.toLocaleString()}
            </span>
          </p>
        </div>
        <p className="mt-4 text-xs font-light text-foreground/40">
          Using {work.entryCount} entries over {work.daysCovered} days.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => confirm(work.trueMaintenance, "calculated")}
            className="flex-1 rounded-xl bg-accent py-3 text-sm text-primary-foreground glow-sm"
          >
            Confirm & save
          </button>
          <button
            onClick={() => setMode("idle")}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-foreground/60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "missing" && missing) {
    const parts = missing.map((m) => {
      const diff = m.want - m.have;
      if (m.need === "entries") return `${diff} more daily entr${diff === 1 ? "y" : "ies"}`;
      return `${diff} more weigh-in${diff === 1 ? "" : "s"}`;
    });
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Not just yet</p>
          <button onClick={() => setMode("idle")}>
            <X className="h-4 w-4 text-foreground/30 hover:text-foreground/60" />
          </button>
        </div>
        <p className="mt-4 text-sm font-light leading-relaxed text-foreground/70">
          To refine from your data, you need <span className="text-foreground">{parts.join(" and ")}</span>.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setMode("manual")}
            className="flex-1 rounded-xl border border-accent/40 py-3 text-sm text-accent"
          >
            Enter by hand instead
          </button>
          <button
            onClick={() => setMode("idle")}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-foreground/60"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (mode === "manual") {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Enter by hand</p>
          <button onClick={() => setMode("idle")}>
            <X className="h-4 w-4 text-foreground/30 hover:text-foreground/60" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">Avg daily calories</span>
            <input
              type="number"
              inputMode="numeric"
              value={manual.avg}
              onChange={(e) => {
                setManual({ ...manual, avg: e.target.value });
                setManualResult(null);
              }}
              placeholder="2200"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-foreground outline-none focus:border-accent/50"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">Weekly weight change (lbs)</span>
            <input
              type="number"
              inputMode="decimal"
              value={manual.change}
              onChange={(e) => {
                setManual({ ...manual, change: e.target.value });
                setManualResult(null);
              }}
              placeholder="-0.8"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-foreground outline-none focus:border-accent/50"
            />
          </label>
        </div>
        <button
          onClick={computeManual}
          disabled={!manual.avg || manual.change === ""}
          className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-sm text-foreground/70 disabled:opacity-40"
        >
          Calculate
        </button>
        {manualResult != null && (
          <div className="mt-4 rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-center">
            <p className="text-xs font-light text-foreground/50">Your data says</p>
            <p className="mt-1 font-display text-3xl text-accent text-glow">{manualResult.toLocaleString()}</p>
            <button
              onClick={() => confirm(manualResult, "manual")}
              className="mt-4 w-full rounded-xl bg-accent py-3 text-sm text-primary-foreground glow-sm"
            >
              Confirm & save
            </button>
          </div>
        )}
      </div>
    );
  }

  if (mode === "saving") {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  return (
    <div>
      {offer && (
        <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/[0.04] p-4">
          <p className="text-sm font-light leading-relaxed text-foreground/70">
            Your latest weigh-in is in. Want to see what your data says your maintenance really is?
          </p>
          <button
            onClick={refineFromLogs}
            className="mt-3 w-full rounded-xl bg-accent py-3 text-sm text-primary-foreground glow-sm"
          >
            Refine now
          </button>
        </div>
      )}
      <button
        onClick={refineFromLogs}
        className="w-full rounded-2xl border border-accent/40 py-4 text-sm tracking-wide text-accent transition-all hover:bg-accent/[0.05]"
      >
        Refine maintenance
      </button>
      <button
        onClick={() => setMode("manual")}
        className="mt-3 w-full text-xs text-foreground/40 transition-colors hover:text-accent"
      >
        Or enter a week by hand
      </button>
    </div>
  );
}