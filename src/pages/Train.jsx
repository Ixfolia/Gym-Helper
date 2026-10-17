import React, { useEffect, useState } from "react";
import { db } from "@/api/db";
import {
  getToday,
  getWeek,
  TRACK_META,
  buildRetargetSession,
  pickLabel,
  defaultSchedule,
  trackSwitchPayload,
  WEEKDAYS,
} from "@/lib/splits";
import { buildTravelDay, getTravelLetter } from "@/lib/travelProtocol";
import { Switch } from "@/components/ui/switch";
import ScreenShell from "@/components/ScreenShell";
import SessionCard from "@/components/train/SessionCard";
import TrainIntro from "@/components/train/TrainIntro";
import TrackSettings from "@/components/train/TrackSettings";
import RetargetPicker from "@/components/train/RetargetPicker";
import WeekView from "@/components/train/WeekView";
import DayDetailSheet from "@/components/train/DayDetailSheet";
import CardioCard from "@/components/train/CardioCard";
import CompleteSessionBar from "@/components/train/CompleteSessionBar";
import { currentPhaseLabel } from "@/lib/sessionCompletion";
import { format } from "date-fns";
import { Settings2 } from "lucide-react";
import PixelGlyph from "@/components/pixel/PixelGlyph";

export default function Train() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [detailIdx, setDetailIdx] = useState(null);
  const [travelLetter, setTravelLetter] = useState(null);
  const [todayCompletion, setTodayCompletion] = useState(null);
  const [journeyPhase, setJourneyPhase] = useState("");

  useEffect(() => {
    db.entities.Profile.list().then((rows) => {
      const p = rows[0] || null;
      setProfile(p);
      if (p) {
        setSchedule(
          p.week_schedule && p.week_schedule.length === 7
            ? p.week_schedule
            : defaultSchedule(p.cadence)
        );
        if (p.travel_mode) setTravelLetter(getTravelLetter(p));
      }
      setLoading(false);
    });
  }, []);

  // Today's session completion (one per day) + current journey phase snapshot.
  useEffect(() => {
    (async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const [comps, journeyRows] = await Promise.all([
        db.entities.SessionCompletion.filter({ date: todayStr }),
        db.entities.JourneyProgress.list(),
      ]);
      setTodayCompletion(comps[0] || null);
      setJourneyPhase(currentPhaseLabel(journeyRows));
    })();
  }, []);

  async function switchTrack(cadence) {
    const payload = trackSwitchPayload(cadence);
    const updated = await db.entities.Profile.update(profile.id, payload);
    setProfile(updated);
    setSchedule(payload.week_schedule);
  }

  async function reorder(from, to) {
    const next = [...schedule];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSchedule(next);
    await db.entities.Profile.update(profile.id, { week_schedule: next });
  }

  async function toggleTravel(v) {
    setTravelLetter(v ? getTravelLetter(profile) : null);
    const updated = await db.entities.Profile.update(profile.id, { travel_mode: v });
    setProfile(updated);
  }

  async function handleCompleted(rec) {
    setTodayCompletion(rec);
    if (profile?.travel_mode && travelLetter) {
      try {
        // Mark the travel session in the workout log so the Winning Week can
        // detect travel weeks and grade them against road-adjusted goals. The
        // completion credit (SessionCompletion) is unchanged — travel sessions
        // still count as full sessions.
        await db.entities.WorkoutLog.create({
          date: rec.date,
          session_name: rec.session_name || "Travel session",
          status: "done",
          mode: "travel",
          travel: true,
        });
        const updated = await db.entities.Profile.update(profile.id, {
          last_travel_session: travelLetter,
        });
        setProfile(updated);
      } catch {}
    }
  }

  async function toggleShortOnTime(v) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const updated = await db.entities.Profile.update(profile.id, {
      short_on_time_date: v ? todayStr : null,
    });
    setProfile(updated);
  }

  if (loading || (profile && !schedule)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  if (!profile) {
    return <TrainIntro onSaved={setProfile} />;
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const shortOnTime = profile.short_on_time_date === todayStr;

  const { weekday, day: scheduledDay } = getToday(profile.cadence, schedule);
  const travelDay = profile.travel_mode ? buildTravelDay(profile, shortOnTime, travelLetter) : null;
  const today = travelDay || scheduledDay;
  const week = getWeek(profile.cadence, schedule);
  const todayIdx = WEEKDAYS.indexOf(weekday);
  const meta = TRACK_META.find((t) => t.cadence === profile.cadence);
  const retargetAreas = profile.retarget_areas || [];
  const custom = retargetAreas.length
    ? {
        areas: retargetAreas.map((k) => pickLabel(k)),
        fullSession: buildRetargetSession(retargetAreas, { half: false }),
        halfSession: buildRetargetSession(retargetAreas, { half: true }),
        cardio: profile.retarget_cardio || "",
      }
    : null;

  return (
    <ScreenShell eyebrow="Train" title="Today's session.">
      <div className="flex items-center justify-between">
        <p className="text-xs font-light text-foreground/40">
          {meta.label} · {weekday}
        </p>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 text-xs text-foreground/40 transition-colors hover:text-accent"
        >
          <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Settings
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <PixelGlyph name="airplane" className={profile.travel_mode ? "" : "opacity-40"} />
          <div>
            <p className="text-sm text-foreground/80">Travel / Home mode</p>
            <p className="text-[11px] font-light text-foreground/40">
              {profile.travel_mode
                ? "On — today swaps to a bodyweight session."
                : "Swap today for a bodyweight session when you're away."}
            </p>
          </div>
        </div>
        <Switch checked={!!profile.travel_mode} onCheckedChange={toggleTravel} />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <PixelGlyph name="stopwatch" className={shortOnTime ? "" : "opacity-40"} />
          <div>
            <p className="text-sm text-foreground/80">Short on time today</p>
            <p className="text-[11px] font-light text-foreground/40">
              {shortOnTime
                ? "On — trimmed sets for today. Full credit."
                : "Trimmed sets. Showing up still counts — full credit."}
            </p>
          </div>
        </div>
        <Switch checked={shortOnTime} onCheckedChange={toggleShortOnTime} />
      </div>

      <div className="mt-5">
        <SessionCard
          day={today}
          isToday
          custom={custom}
          completed={!!todayCompletion}
          onBuild={() => setPickerOpen(true)}
          shortOnTime={shortOnTime}
          profile={profile}
          onCardioSaved={setProfile}
        />
      </div>

      <div className="mt-5">
        <CompleteSessionBar
          sessionName={today.title}
          journeyPhase={journeyPhase}
          completion={todayCompletion}
          travel={!!(profile.travel_mode && travelLetter)}
          onCompleted={handleCompleted}
          onUndone={() => setTodayCompletion(null)}
        />
      </div>

      <div className="mt-14">
        <div className="flex items-end justify-between">
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">This week</p>
          <p className="text-[10px] font-light text-foreground/30">Drag to rearrange · tap to view</p>
        </div>
        <div className="mt-4">
          <WeekView
            week={week}
            todayIdx={todayIdx}
            custom={custom}
            todayCompleted={!!todayCompletion}
            onReorder={reorder}
            onOpenDay={(idx) => setDetailIdx(idx)}
          />
          <CardioCard profile={profile} />
        </div>
      </div>

      <TrackSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentCadence={profile.cadence}
        travelMode={!!profile.travel_mode}
        onToggleTravel={toggleTravel}
        laggingAreas={custom?.areas || []}
        onEditLagging={() => {
          setSettingsOpen(false);
          setPickerOpen(true);
        }}
        onSwitch={(c) => {
          switchTrack(c);
        }}
      />

      <RetargetPicker
        open={pickerOpen}
        profile={profile}
        onClose={() => setPickerOpen(false)}
        onSaved={(p) => setProfile(p)}
      />

      {detailIdx !== null && (
        <DayDetailSheet
          weekday={week[detailIdx].weekday}
          day={
            detailIdx === todayIdx && travelDay ? travelDay : week[detailIdx].day
          }
          custom={custom}
          isToday={detailIdx === todayIdx}
          completed={detailIdx === todayIdx && !!todayCompletion}
          shortOnTime={detailIdx === todayIdx && shortOnTime}
          profile={profile}
          onCardioSaved={setProfile}
          onBuild={() => {
            setDetailIdx(null);
            setPickerOpen(true);
          }}
          onClose={() => setDetailIdx(null)}
        />
      )}
    </ScreenShell>
  );
}