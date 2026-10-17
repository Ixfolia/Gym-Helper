import React, { useState } from "react";
import { Sparkles, Moon, Crosshair, Pencil, Check, Plane, Zap, Clock } from "lucide-react";
import { buildExpressSession, estimateExpressMinutes, trimSetsDisplay } from "@/lib/splits";
import RetargetCardioSlot from "./RetargetCardioSlot";
import TravelSessionView from "./TravelSessionView";
import PixelGlyph from "@/components/pixel/PixelGlyph";
import ExerciseRow from "./ExerciseRow";

const typeMeta = {
  standard: { icon: Crosshair, tag: "Session" },
  retarget: { icon: Sparkles, tag: "Retargeting" },
  rest: { icon: Moon, tag: "Rest / Active" },
  travel: { icon: Plane, tag: "Travel" },
};

export default function SessionCard({ day, isToday = false, custom, onBuild, completed = false, shortOnTime = false, profile, onCardioSaved }) {
  const [expressOn, setExpressOn] = useState(false);
  if (!day) return null;
  const meta = typeMeta[day.type] || typeMeta.standard;
  const Icon = meta.icon;
  const isRetarget = day.type === "retarget";
  const isFifty = isRetarget && day.title.includes("50/50");
  const builtSession = isFifty ? custom?.halfSession : custom?.fullSession;
  const built = isRetarget && builtSession?.length;
  const tag = isRetarget
    ? built
      ? "Retargeting — built for you"
      : "Retargeting — flex day"
    : meta.tag;
  const expressDay = day.type === "standard" ? buildExpressSession(day) : null;
  const time = expressDay ? estimateExpressMinutes(day) : null;
  // Short on time: standard days swap to the true Express session; retarget and
  // travel days keep their existing set-trim behavior (upgrade comes separately).
  const useExpress = !!expressDay && (shortOnTime || expressOn);

  return (
    <div
      className={`rounded-3xl border p-6 transition-colors ${
        isToday
          ? "border-accent/30 bg-accent/[0.04] glow-sm"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">
          {day.type === "travel" ? "Travel / Home · bodyweight" : `Day ${day.day} · ${tag}`}
        </span>
        <div className="flex items-center gap-2">
          {isRetarget && built && (
            <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/[0.08] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-accent">
              <Check className="h-2.5 w-2.5" strokeWidth={2} /> Built for you
            </span>
          )}
          {isRetarget && !built && (
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-foreground/40">
              Customizes later
            </span>
          )}
          {completed && (
            <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/[0.08] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-accent">
              <Check className="h-2.5 w-2.5" strokeWidth={2} /> Completed
            </span>
          )}
          {day.type === "travel" ? (
            <PixelGlyph name="airplane" className={isToday ? "" : "opacity-40"} />
          ) : (
            <Icon className={`h-4 w-4 ${isToday ? "text-accent" : "text-foreground/30"}`} strokeWidth={1.5} />
          )}
        </div>
      </div>

      <h2 className="mt-4 font-display text-2xl font-light tracking-tight text-foreground">
        {useExpress ? expressDay.title : day.title}
      </h2>

      {day.banner && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/[0.05] px-3 py-2.5">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent glow-sm" />
          <p className="text-xs font-light leading-relaxed text-accent/90">{day.banner}</p>
        </div>
      )}

      {isRetarget ? (
        built ? (
          <div>
            <p className="mt-3 text-sm font-light text-foreground/55">
              Prioritizing <span className="text-accent">{custom.areas.join(" + ")}</span>
              {isFifty ? " · plus your cardio/activity" : ""}.
            </p>
            <ol className="mt-6 space-y-5">
              {builtSession.map((ex) => (
                <ExerciseRow
                  key={ex.n}
                  n={ex.n}
                  ex={shortOnTime ? { ...ex, prescription: trimSetsDisplay(ex.prescription) } : ex}
                  completed={completed}
                />
              ))}
            </ol>
            {isFifty && profile && (
              <RetargetCardioSlot profile={profile} cardio={custom?.cardio} onSaved={onCardioSaved} />
            )}
            <div className="mt-6">
              <button
                onClick={onBuild}
                className="flex items-center gap-1.5 text-xs text-foreground/40 transition-colors hover:text-accent"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} /> Edit your retargeting day
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mt-5 text-sm font-light leading-relaxed text-foreground/55">
              {day.description}
            </p>
            <button
              onClick={onBuild}
              className="mt-6 w-full rounded-2xl border border-accent/40 py-4 text-sm tracking-wide text-accent transition-all hover:bg-accent/[0.05]"
            >
              Build your retargeting day
            </button>
          </div>
        )
      ) : day.type === "standard" ? (
        useExpress ? (
          <div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/[0.05] px-3 py-2">
              <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              <span className="text-xs text-accent">Express session</span>
              {time?.saved > 0 && (
                <span className="ml-auto text-[11px] font-light text-foreground/50">
                  ~{time.saved} min saved
                </span>
              )}
            </div>
            <ExerciseList exercises={expressDay.exercises} completed={completed} />
            {expressDay.note && (
              <p className="mt-4 text-xs font-light leading-relaxed text-foreground/45">
                {expressDay.note}
              </p>
            )}
            {!shortOnTime && (
              <button
                onClick={() => setExpressOn(false)}
                className="mt-6 flex items-center gap-1.5 text-xs text-foreground/40 transition-colors hover:text-accent"
              >
                <Clock className="h-3.5 w-3.5" strokeWidth={1.5} /> Show full session
              </button>
            )}
          </div>
        ) : (
          <div>
            <ExerciseList exercises={day.exercises} trim={shortOnTime} completed={completed} />
            {expressDay && !shortOnTime && (
              <button
                onClick={() => setExpressOn(true)}
                className="mt-6 flex items-center gap-1.5 text-xs text-foreground/40 transition-colors hover:text-accent"
              >
                <Zap className="h-3.5 w-3.5" strokeWidth={1.5} /> Short on time? Express —{" "}
                {expressDay.exercises.length} moves
                {time?.saved > 0 && ` · ~${time.saved} min saved`}
              </button>
            )}
          </div>
        )
      ) : day.type === "travel" ? (
        <TravelSessionView day={day} profile={profile} onProfileSaved={onCardioSaved} completed={completed} />
      ) : (
        <p className="mt-5 text-sm font-light leading-relaxed text-foreground/55">
          {day.description}
        </p>
      )}
    </div>
  );
}

function ExerciseList({ exercises, trim = false, completed = false }) {
  return (
    <ol className="mt-6 space-y-5">
      {exercises.map((ex) => (
        <ExerciseRow
          key={ex.n}
          n={ex.n}
          ex={trim ? { ...ex, prescription: trimSetsDisplay(ex.prescription) } : ex}
          completed={completed}
        />
      ))}
    </ol>
  );
}