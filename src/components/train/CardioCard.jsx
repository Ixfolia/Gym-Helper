import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { db } from "@/api/db";
import { Activity, Check } from "lucide-react";

export default function CardioCard({ profile }) {
  const [doneToday, setDoneToday] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!profile?.cardio_enabled) return;
    (async () => {
      try {
        const logs = await db.entities.WorkoutLog.filter({ date: today });
        setDoneToday(logs.some((l) => l.mode === "cardio"));
      } catch {
        /* ignore */
      }
    })();
  }, [profile?.cardio_enabled, today]);

  if (!profile?.cardio_enabled) return null;

  async function mark() {
    if (doneToday || saving) return;
    setSaving(true);
    try {
      await db.entities.WorkoutLog.create({
        date: today,
        status: "done",
        mode: "cardio",
        session_name: profile.cardio_style || "Cardio",
      });
      setDoneToday(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.015] px-3 py-3">
      <Activity className="h-4 w-4 text-accent/70" strokeWidth={1.75} />
      <div className="flex-1">
        <p className="text-sm text-foreground/80">{profile.cardio_style || "Cardio"}</p>
        <p className="text-[11px] font-light text-foreground/40">
          {profile.cardio_frequency || 0}× / week · counts as a workout
        </p>
      </div>
      <button
        onClick={mark}
        disabled={doneToday || saving}
        className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
          doneToday
            ? "border-accent/40 bg-accent/[0.06] text-accent"
            : "border-white/10 text-foreground/60 hover:border-accent/40"
        }`}
      >
        {doneToday ? (
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" strokeWidth={2.5} /> Done
          </span>
        ) : (
          "Mark done"
        )}
      </button>
    </div>
  );
}