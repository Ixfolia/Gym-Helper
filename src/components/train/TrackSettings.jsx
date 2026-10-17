import React from "react";
import { Switch } from "@/components/ui/switch";
import { TRACK_META } from "@/lib/splits";
import { Check, Plane } from "lucide-react";

export default function TrackSettings({
  currentCadence,
  onSwitch,
  open,
  onClose,
  laggingAreas,
  onEditLagging,
  travelMode,
  onToggleTravel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-3xl border border-white/[0.06] bg-card sm:rounded-3xl">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-6">
          <p className="text-[10px] uppercase tracking-[0.32em] text-foreground/40">Settings</p>
          <h2 className="mt-2 font-display text-xl font-light tracking-tight text-foreground">
            Switch split track
          </h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-foreground/50">
            Your program content stays the same — only the weekly cadence changes.
          </p>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Lagging areas</p>
              <button
                onClick={onEditLagging}
                className="text-xs text-accent/80 transition-colors hover:text-accent"
              >
                Edit
              </button>
            </div>
            <p className="mt-2 text-sm font-light text-foreground/70">
              {laggingAreas && laggingAreas.length ? laggingAreas.join(" + ") : "Not set yet"}
            </p>
            <p className="mt-1 text-[11px] font-light text-foreground/40">
              Retargeting days rebuild instantly around your picks.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plane className="h-4 w-4 text-foreground/50" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">
                    Travel / Home mode
                  </p>
                  <p className="mt-1 text-xs font-light text-foreground/55">
                    Replace today's session with a bodyweight protocol. Off resumes the split.
                  </p>
                </div>
              </div>
              <Switch checked={!!travelMode} onCheckedChange={onToggleTravel} />
            </div>
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Split track</p>
          <div className="mt-4 space-y-3">
            {TRACK_META.map((t) => {
              const active = t.cadence === currentCadence;
              return (
                <button
                  key={t.cadence}
                  onClick={() => onSwitch(t.cadence)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                    active
                      ? "border-accent/40 bg-accent/[0.05]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-accent/30"
                  }`}
                >
                  <div>
                    <p className="text-sm text-foreground">{t.label}</p>
                    <p className="mt-1 text-xs font-light text-foreground/40">{t.name}</p>
                  </div>
                  {active && <Check className="h-4 w-4 text-accent glow-sm" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] bg-card px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] py-3 text-sm text-foreground/70 transition-colors hover:bg-white/[0.04]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}