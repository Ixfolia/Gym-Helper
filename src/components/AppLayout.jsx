import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import ResetProtocol from "@/components/ResetProtocol";
import { needsReset } from "@/lib/resetProtocol";
import { db } from "@/api/db";
import { WizardNavContext } from "@/lib/wizardNavContext";

export default function AppLayout() {
  const navigate = useNavigate();
  const [resetState, setResetState] = useState(null);
  const [hideNav, setHideNav] = useState(false);
  const dismissed = typeof window !== "undefined" && sessionStorage.getItem("resetDismissed") === "1";

  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    (async () => {
      try {
        const [profiles, dailyLogs, weighIns, workoutLogs, habitLogs, history] = await Promise.all([
          db.entities.Profile.list(),
          db.entities.DailyLog.list("-date", 40),
          db.entities.WeighIn.list("-date", 30),
          db.entities.WorkoutLog.list("-date", 40),
          db.entities.HabitLog.list("-date", 200),
          db.entities.MaintenanceHistory.list("-date", 30),
        ]);
        if (cancelled) return;
        const profile = profiles[0] || null;
        if (profile && needsReset({ dailyLogs, weighIns, workoutLogs, habitLogs })) {
          setResetState({ profile, history, dailyLogs, weighIns });
        }
      } catch {
        /* never block the app on reset detection */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dismissed]);

  function handleResetDone(dest) {
    sessionStorage.setItem("resetDismissed", "1");
    setResetState(null);
    if (dest) navigate(dest);
  }

  return (
    <WizardNavContext.Provider value={{ hideNav, setHideNav }}>
      <div className="relative min-h-screen bg-starfield text-foreground">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(0,212,255,0.08),transparent_70%)]" />
        <div className="relative">
          <Outlet />
        </div>
        {!hideNav && <BottomNav />}
        {resetState && (
          <ResetProtocol
            profile={resetState.profile}
            history={resetState.history}
            dailyLogs={resetState.dailyLogs}
            weighIns={resetState.weighIns}
            onDone={handleResetDone}
          />
        )}
      </div>
    </WizardNavContext.Provider>
  );
}