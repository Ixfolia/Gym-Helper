import React from "react";
import { Plane, Dumbbell } from "lucide-react";
import {
  TRAVEL_INTRO,
  NATURE_CARDIO,
  CREATIVE_CARDIO,
  THE_COUNTDOWN,
  MED_BALL_CIRCUIT,
  DB_MENU,
  DB_MENU_NOTE,
} from "@/lib/travelProtocol";
import ExerciseRow from "./ExerciseRow";
import TravelKitToggles from "./TravelKitToggles";

// Travel System v2 renderer. Shown by SessionCard when today's day is a travel
// session. Handles its own equipment-checklist persistence (updates
// Profile.travel_equipment, then refreshes the parent profile via onProfileSaved).
export default function TravelSessionView({ day, profile, onProfileSaved, completed = false }) {
  const equipment = profile?.travel_equipment || {};
  const has = (k) => !!equipment[k];

  const visibleBlocks = day.blocks.filter((b) => !b.requires || has(b.requires));

  return (
    <div className="mt-5 space-y-5">
      <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <Plane className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.5} />
        <p className="text-xs font-light leading-relaxed text-foreground/60">{TRAVEL_INTRO}</p>
      </div>

      <TravelKitToggles profile={profile} onSaved={onProfileSaved} />

      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
          {day.isRush ? "Rush Stack · short on time" : `Hotel Bodyweight Protocol · ${day.letter}`}
        </p>
        <ol className="mt-4 space-y-5">
          {visibleBlocks.map((ex, i) => (
            <ExerciseRow key={i} n={i + 1} ex={ex} completed={completed} />
          ))}
        </ol>
      </div>

      {!day.isRush && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
            Or swap the ab finisher for
          </p>
          <div className="mt-3 space-y-3">
            <FinisherCard {...THE_COUNTDOWN} />
            {has("medicine_ball") && <FinisherCard {...MED_BALL_CIRCUIT} />}
          </div>
        </div>
      )}

      {day.isRush && (
        <div className="rounded-xl border border-accent/30 bg-accent/[0.05] px-3 py-3">
          <p className="text-xs font-light leading-relaxed text-accent/90">{CREATIVE_CARDIO}</p>
        </div>
      )}

      {has("dumbbells") && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Dumbbell menu</p>
          </div>
          <p className="mt-2 text-xs font-light leading-relaxed text-foreground/40">{DB_MENU_NOTE}</p>
          <ol className="mt-3 space-y-3">
            {DB_MENU.map((ex, i) => (
              <ExerciseRow key={i} n={i + 1} ex={ex} completed={completed} />
            ))}
          </ol>
        </div>
      )}

      <p className="text-xs font-light leading-relaxed text-foreground/40">{NATURE_CARDIO}</p>
    </div>
  );
}

function FinisherCard({ name, prescription }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <p className="mt-1 text-xs font-light leading-relaxed text-foreground/55">{prescription}</p>
    </div>
  );
}