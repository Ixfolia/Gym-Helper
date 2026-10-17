import React from "react";
import { db } from "@/api/db";
import { Circle, CheckCircle2 } from "lucide-react";
import { TRAVEL_EQUIPMENT } from "@/lib/travelProtocol";

// Shared travel-equipment toggle UI. Owns the "I have:" chip list and its own
// persistence (updates Profile.travel_equipment, then calls onSaved with the
// updated profile). Used by both TravelSessionView and the Settings Travel
// section so there is one implementation.
export default function TravelKitToggles({ profile, onSaved }) {
  const equipment = profile?.travel_equipment || {};
  const has = (k) => !!equipment[k];

  async function toggle(key) {
    const next = { ...equipment, [key]: !equipment[key] };
    try {
      const updated = await db.entities.Profile.update(profile.id, { travel_equipment: next });
      onSaved?.(updated);
    } catch {}
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">I have:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TRAVEL_EQUIPMENT.map((eq) => {
          const on = has(eq.key);
          return (
            <button
              key={eq.key}
              onClick={() => toggle(eq.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                on
                  ? "border-accent/40 bg-accent/[0.08] text-accent"
                  : "border-white/15 text-foreground/55 hover:border-accent/30"
              }`}
            >
              {on ? (
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Circle className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              {eq.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}