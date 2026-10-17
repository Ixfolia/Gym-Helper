import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { db } from "@/api/db";
import ScreenShell from "@/components/ScreenShell";
import GateFloor from "@/components/gate/GateFloor";
import Certificate from "@/components/gate/Certificate";
import GateCelebration from "@/components/gate/GateCelebration";
import HonestyCheck from "@/components/gate/HonestyCheck";
import { evaluateGate } from "@/lib/gate";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";
import { useWeightUnit } from "@/lib/weightUnitContext";
import { ArrowLeft } from "lucide-react";

export default function Gate() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [certifying, setCertifying] = useState(false);
  const [certified, setCertified] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [honesty, setHonesty] = useState("check");
  const { unit } = useWeightUnit();

  useEffect(() => {
    (async () => {
      const [profiles, logs, weighIns, habitLogs, workoutLogs, history, photos, journey, sessionCompletions, weeklySummaries] =
        await Promise.all([
          db.entities.Profile.list(),
          db.entities.DailyLog.list("-date", 300),
          db.entities.WeighIn.list("-date", 100),
          db.entities.HabitLog.list("-date", 600),
          db.entities.WorkoutLog.list("-date", 200),
          db.entities.MaintenanceHistory.list("-date", 50),
          db.entities.ProgressPhoto.list("-date", 100),
          db.entities.JourneyProgress.list(),
          db.entities.SessionCompletion.list("-date", 200),
          db.entities.WeeklySummary.list("-date", 200),
        ]);
      const profile = profiles[0] || null;
      const already = journey.some((r) => r.step === "p3-5" && r.status === "done");
      setCertified(already);
      setData({ profile, photos, rawCtx: { logs, weighIns, habitLogs, workoutLogs, history, photos, sessionCompletions, weeklySummaries, journeyProgress: journey }, journey });
      try {
        const urls = await db.photos.urls(photos.map((p) => p.id));
        setSignedUrls(urls);
      } catch {
        setSignedUrls({});
      }
    })();
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  // The gate's floors are all measured against a profile; before onboarding
  // there is nothing to evaluate, so send the member to set their baseline.
  if (!data.profile) {
    return <Navigate to="/fuel" replace />;
  }

  const gate = data.rawCtx
    ? evaluateGate({ profile: data.profile, ...data.rawCtx, unit })
    : null;
  const { photos } = data;

  async function certify() {
    if (certifying || certified) {
      setCelebrate(true);
      return;
    }
    setCertifying(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const rec = data.journey?.find((r) => r.step === "p3-5");
      if (rec) {
        await db.entities.JourneyProgress.update(rec.id, {
          status: "done",
          completed_date: today,
        });
      } else {
        await db.entities.JourneyProgress.create({
          step: "p3-5",
          status: "done",
          completed_date: today,
        });
      }
      setCertified(true);
      setCelebrate(true);
    } finally {
      setCertifying(false);
    }
  }

  async function share() {
    const lbl = unitLabel(unit);
    const text = `First Real Transformation certified — ${gate.weeksTracked} weeks tracked, ${gate.wonWeeks} winning weeks, weight ${
        gate.delta > 0 ? "+" : ""
      }${kgToUnit(gate.delta, unit)} ${lbl} toward my goal. The Gate is open.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "First Real Transformation", text });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <ScreenShell eyebrow="Journey" title="The Gate.">
      <button
        onClick={() => navigate("/journey")}
        className="mb-4 flex items-center gap-1.5 text-xs text-foreground/40 transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Back to the ascent
      </button>

      <p className="text-sm font-light leading-relaxed text-foreground/55">
        Phase 3's final door. Five objective floors — no judgment, just data. When all five
        are met, your first real transformation is certified and Phase 4 opens.
      </p>

      <div className="mt-8 space-y-3">
        {gate.floors.map((f) => (
          <GateFloor key={f.id} floor={f} />
        ))}
      </div>

      {gate.allMet && (
        <div className="mt-8">
          {certified ? (
            <>
              <Certificate
                photos={photos}
                signedUrls={signedUrls}
                weeksTracked={gate.weeksTracked}
                wonWeeks={gate.wonWeeks}
                delta={gate.delta}
              />
              <p className="mt-5 text-center text-sm font-light text-accent/80">
                Phase 4 is unlocked — keep climbing.
              </p>
            </>
          ) : honesty === "check" ? (
            <HonestyCheck
              photos={photos}
              signedUrls={signedUrls}
              onWorthy={() => setHonesty("worthy")}
              onNotYet={() => setHonesty("notyet")}
            />
          ) : honesty === "notyet" ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
              <p className="text-sm font-light leading-relaxed text-foreground/65">
                Phase 4 isn't given. It's earned. And when you earn it, it means everything. Keep
                stacking wins — you can run this check again any time.
              </p>
              <button
                onClick={() => setHonesty("check")}
                className="mt-4 rounded-2xl border border-accent/30 bg-accent/[0.06] px-4 py-2.5 text-xs text-accent transition-all hover:bg-accent/[0.1]"
              >
                Run the check again
              </button>
            </div>
          ) : (
            <>
              <Certificate
                photos={photos}
                signedUrls={signedUrls}
                weeksTracked={gate.weeksTracked}
                wonWeeks={gate.wonWeeks}
                delta={gate.delta}
              />
              <button
                onClick={certify}
                disabled={certifying}
                className="mt-6 w-full rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
              >
                {certifying ? "Opening the Gate…" : "Walk through the Gate"}
              </button>
            </>
          )}
        </div>
      )}

      {!gate.allMet && (
        <p className="mt-8 text-center text-sm font-light leading-relaxed text-foreground/45">
          Not yet — here's the distance. No failure, just the next floor. Keep living the
          system and the checks light up on their own.
        </p>
      )}

      {celebrate && (
        <GateCelebration
          onClose={() => setCelebrate(false)}
          onShare={share}
        />
      )}
    </ScreenShell>
  );
}