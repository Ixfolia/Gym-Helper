import React, { useState } from "react";
import { db } from "@/api/db";
import { Activity, Pencil, X } from "lucide-react";

const CARDIO_OPTIONS = ["Stairmaster", "Walk", "Bike ride"];

export default function RetargetCardioSlot({ profile, cardio, onSaved }) {
  const [editing, setEditing] = useState(!cardio);
  const [value, setValue] = useState(cardio || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await db.entities.Profile.update(profile.id, {
        retarget_cardio: value.trim(),
      });
      setSaving(false);
      setEditing(false);
      onSaved?.(updated);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">
          Cardio / activity (50/50)
        </p>
        {cardio && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-accent"
          >
            <Pencil className="h-3 w-3" strokeWidth={1.5} /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {CARDIO_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setValue(c)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  value === c
                    ? "border-accent text-accent"
                    : "border-white/10 text-foreground/55 hover:border-accent/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your favorite cardio"
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-foreground outline-none focus:border-accent/50"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !value.trim()}
              className="flex-1 rounded-xl bg-accent py-2.5 text-xs text-primary-foreground glow-sm disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {cardio && (
              <button
                onClick={() => {
                  setValue(cardio);
                  setEditing(false);
                }}
                className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-foreground/60"
              >
                <X className="h-3 w-3" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent/70" strokeWidth={1.75} />
          <p className="text-sm font-light text-foreground/75">{cardio}</p>
        </div>
      )}
    </div>
  );
}