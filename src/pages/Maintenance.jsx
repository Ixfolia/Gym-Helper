import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { db } from "@/api/db";
import ScreenShell from "@/components/ScreenShell";
import ConfidenceMeter from "@/components/fuel/ConfidenceMeter";
import RefinementEngine from "@/components/fuel/RefinementEngine";
import PeriodizationSettings from "@/components/fuel/PeriodizationSettings";
import { currentMaintenance } from "@/lib/metabolism";

export default function Maintenance() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [weighIns, setWeighIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      const [profiles, h, l, w] = await Promise.all([
        db.entities.Profile.list(),
        db.entities.MaintenanceHistory.list("-date", 50),
        db.entities.DailyLog.list("-date", 90),
        db.entities.WeighIn.list("-date", 30),
      ]);
      setProfile(profiles[0]);
      setHistory(h);
      setLogs(l);
      setWeighIns(w);
      setLoading(false);
    })();
  }, [refreshKey]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const info = currentMaintenance(profile, history);
  const setLine =
    info.refinements === 0
      ? "Estimated from your stats and activity."
      : `Last refined from your data on ${format(new Date(info.date), "MMM d")}.`;

  const sortedWeighIns = [...weighIns].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const latestWeighIn = sortedWeighIns[0] || null;
  const entryCount = logs.filter((l) => l.calories > 0).length;
  const offer =
    latestWeighIn &&
    (!info.date || latestWeighIn.date > info.date) &&
    entryCount >= 7 &&
    weighIns.length >= 2;

  return (
    <ScreenShell eyebrow="Fuel">
      <div className="flex flex-col items-center pt-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">Your maintenance</p>
        <p className="mt-6 font-display text-[5rem] font-extralight leading-none text-accent text-glow">
          {info.value.toLocaleString()}
        </p>
        <p className="mt-3 text-xs font-light text-foreground/45">cal / day</p>
        <div className="mt-6">
          <ConfidenceMeter
            level={info.refinements === 0 ? 1 : info.refinements >= 3 ? 3 : 2}
            label={info.confidence}
          />
        </div>
        <p className="mt-3 text-xs font-light text-foreground/40">{setLine}</p>
      </div>

      <div className="mt-10">
        <RefinementEngine
          logs={logs}
          weighIns={weighIns}
          offer={offer}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <div className="mt-6">
        <PeriodizationSettings
          profile={profile}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          to="/fuel/goal"
          className="text-xs text-foreground/50 transition-colors hover:text-accent"
        >
          Your goal & pace →
        </Link>
        <Link
          to="/fuel"
          className="text-xs text-foreground/40 transition-colors hover:text-accent"
        >
          ← Back to today
        </Link>
      </div>
    </ScreenShell>
  );
}