import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ScreenShell from "@/components/ScreenShell";
import { db } from "@/api/db";
import { performReset } from "@/lib/resetProtocol";
import { ArrowLeft, Home, RotateCcw } from "lucide-react";
import ProfileGoalsCard from "@/components/settings/ProfileGoalsCard";
import MetabolismCalibrationCard from "@/components/settings/MetabolismCalibrationCard";
import TrainingCard from "@/components/settings/TrainingCard";
import HabitsCard from "@/components/settings/HabitsCard";
import DataCard from "@/components/settings/DataCard";
import CoachCard from "@/components/settings/CoachCard";

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    db.entities.Profile.list().then((rows) => setProfile(rows[0] || null));
    db.entities.MaintenanceHistory.list("-date", 50).then(setHistory).catch(() => {});
  }, []);

  function refresh() {
    db.entities.Profile.list().then((rows) => setProfile(rows[0] || null));
    db.entities.MaintenanceHistory.list("-date", 50).then(setHistory).catch(() => {});
  }

  // After a successful Settings save, refresh profile state from the update's
  // returned row so later saves never resend stale values and the maintenance
  // readout / trajectory inputs / train splits read the new values immediately.
  // Falls back to a full re-fetch when a card saves without returning a row.
  function handleSaved(updated) {
    if (updated) setProfile(updated);
    else refresh();
  }

  async function reset() {
    setBusy(true);
    try {
      await performReset(profile);
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell
      eyebrow="Settings"
      title="Settings."
      headerAction={
        <Link to="/" aria-label="Home" className="text-foreground/45 transition-colors hover:text-foreground/80">
          <Home className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Link>
      }
    >
      <button
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-1.5 text-xs text-foreground/40 transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Back
      </button>

      {profile && (
        <div className="mb-6">
          <ProfileGoalsCard profile={profile} onSaved={handleSaved} />
        </div>
      )}

      {profile && (
        <div className="mb-6">
          <MetabolismCalibrationCard profile={profile} history={history} onSaved={handleSaved} />
        </div>
      )}

      {profile && (
        <div className="mb-6">
          <TrainingCard profile={profile} onSaved={handleSaved} />
        </div>
      )}

      {profile && (
        <div className="mb-6">
          <HabitsCard profile={profile} />
        </div>
      )}

      <CoachCard />

      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/[0.06]">
            <RotateCcw className="h-4 w-4 text-accent" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm text-foreground">Reset my week</p>
            <p className="text-[11px] font-light text-foreground/45">
              Start a fresh week from today. Clears nothing.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm font-light leading-relaxed text-foreground/55">
          Falling off is normal — staying off is the only failure. Your history is data, never
          shame. A reset restarts your current week from today and prompts a fresh weigh-in; nothing
          is deleted.
        </p>
        {done ? (
          <button
            onClick={() => navigate("/fuel")}
            className="mt-5 w-full rounded-2xl bg-accent py-3.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md"
          >
            Fresh week started — log today
          </button>
        ) : (
          <button
            onClick={reset}
            disabled={busy || !profile}
            className="mt-5 w-full rounded-2xl border border-accent/40 py-3.5 text-sm text-accent transition-all hover:bg-accent/[0.06] disabled:opacity-40"
          >
            {busy ? "Starting…" : "Reset my week"}
          </button>
        )}
      </div>

      <DataCard />
    </ScreenShell>
  );
}