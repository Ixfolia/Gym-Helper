import React, { useEffect, useRef, useState } from "react";
import { db } from "@/api/db";
import { Switch } from "@/components/ui/switch";
import BigChoice from "@/components/fuel/BigChoice";
import SummaryRow from "@/components/settings/SummaryRow";
import RetargetPicker from "@/components/train/RetargetPicker";
import CardioCard from "@/components/train/CardioCard";
import RetargetCardioSlot from "@/components/train/RetargetCardioSlot";
import TravelKitToggles from "@/components/train/TravelKitToggles";
import PixelGlyph from "@/components/pixel/PixelGlyph";
import { pickLabel, getDayByKey, trackSwitchPayload, defaultSchedule, WEEKDAYS } from "@/lib/splits";
import { GripVertical } from "lucide-react";
import { Reorder } from "framer-motion";

// Training settings. Cadence switches the whole track (cadence + track +
// default week_schedule) exactly like Train's switchTrack, saved immediately
// on selection. Lagging areas open the RetargetPicker. Weekly schedule is an
// inline Mon–Sun list with ▲▼ reorder (each move persists). Cardio embeds
// CardioCard + RetargetCardioSlot. Travel is a mode toggle + shared equipment
// toggles. Review cadence saves via the Save button.
const CADENCE = [
  { value: "3-5", label: "3–5 sessions / week" },
  { value: "4-6", label: "4–6 sessions / week" },
];
const REVIEW = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

// Unique {id, key} wrappers for the weekly schedule so framer-motion Reorder can
// track rows even when two days share a session key (e.g. two rest days).
const buildSlots = (p) =>
  ((p?.week_schedule?.length === 7 ? p.week_schedule : defaultSchedule(p?.cadence)) || []).map((key, i) => ({
    id: `s${i}`,
    key,
  }));

export default function TrainingCard({ profile, onSaved }) {
  const [cadence, setCadence] = useState(profile?.cadence || null);
  const [review, setReview] = useState(profile?.review_cadence || "weekly");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Reorderable weekly schedule. The weekday label is positional (WEEKDAYS[i]
  // stays Mon→Sun); dragging reorders the session sequence — exactly what the
  // old ▲▼ arrows did — persisting Profile.update({ week_schedule }).
  const [slots, setSlots] = useState(() => buildSlots(profile));
  const slotsRef = useRef(slots);
  const lastSigRef = useRef((profile?.week_schedule || []).join(","));

  // Re-sync whenever the persisted week_schedule / cadence changes (cadence
  // switch resets to default, or a drag save landed). Skips a rebuild when the
  // saved order already matches the dragged order, so a drop never flickers.
  useEffect(() => {
    const persisted =
      (profile?.week_schedule?.length === 7 ? profile.week_schedule : defaultSchedule(profile?.cadence)) || [];
    const sig = persisted.join(",");
    if (sig !== lastSigRef.current) {
      const next = persisted.map((key, i) => ({ id: `s${i}`, key }));
      setSlots(next);
      slotsRef.current = next;
      lastSigRef.current = sig;
    }
  }, [profile?.week_schedule, profile?.cadence]);

  const cad = profile?.cadence;

  async function switchCadence(c) {
    setCadence(c);
    const updated = await db.entities.Profile.update(profile.id, trackSwitchPayload(c));
    onSaved?.(updated);
  }

  async function persistSlots(next) {
    const week_schedule = next.map((s) => s.key);
    const updated = await db.entities.Profile.update(profile.id, { week_schedule });
    lastSigRef.current = week_schedule.join(",");
    onSaved?.(updated);
  }

  async function toggleTravel(v) {
    const updated = await db.entities.Profile.update(profile.id, { travel_mode: v });
    onSaved?.(updated);
  }

  async function saveReview() {
    setSaving(true);
    try {
      const updated = await db.entities.Profile.update(profile.id, { review_cadence: review });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      onSaved?.(updated);
    } finally {
      setSaving(false);
    }
  }

  const picks = profile?.retarget_areas || [];
  const areasStr = picks.length
    ? picks
        .map((p) => `${pickLabel(p)}${p.allocation != null ? ` ${p.allocation}%` : ""}`)
        .join(" · ")
    : "—";

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <p className="text-sm text-foreground">Training</p>
      <p className="text-[11px] font-light text-foreground/45">Your weekly rhythm and focus.</p>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Cadence</p>
      <div className="mt-2 space-y-3">
        {CADENCE.map((c) => (
          <BigChoice key={c.value} label={c.label} selected={cadence === c.value} onClick={() => switchCadence(c.value)} />
        ))}
      </div>
      <p className="mt-2 text-[11px] font-light text-foreground/40">
        Switching cadence resets your weekly order to the default for that track.
      </p>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Review cadence</p>
      <div className="mt-2 space-y-3">
        {REVIEW.map((r) => (
          <BigChoice key={r.value} label={r.label} selected={review === r.value} onClick={() => setReview(r.value)} />
        ))}
      </div>

      <div className="mt-5">
        <SummaryRow label="Lagging areas" value={areasStr} onAction={() => setPickerOpen(true)} />
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Weekly schedule</p>
      <Reorder.Group
        as="div"
        axis="y"
        values={slots}
        onReorder={(next) => {
          setSlots(next);
          slotsRef.current = next;
        }}
        className="mt-2 space-y-1.5"
      >
        {slots.map((slot, i) => {
          const day = getDayByKey(cad, slot.key);
          return (
            <Reorder.Item
              as="div"
              key={slot.id}
              value={slot}
              onDragEnd={() => {
                const next = slotsRef.current;
                if (next.map((s) => s.key).join(",") !== lastSigRef.current) persistSlots(next);
              }}
              whileDrag={{ scale: 1.03, boxShadow: "0 10px 28px rgba(30,155,255,0.20)" }}
              className="flex cursor-grab items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 active:cursor-grabbing"
            >
              <span className="w-8 font-mono text-xs text-foreground/40">{WEEKDAYS[i]}</span>
              <span className="flex-1 truncate text-sm font-light text-foreground/80">
                {day ? day.title : "—"}
              </span>
              <GripVertical className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      <p className="mt-2 text-[11px] font-light text-foreground/40">You can also drag days on Train.</p>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Cardio</p>
      <CardioCard profile={profile} />
      <RetargetCardioSlot profile={profile} cardio={profile?.retarget_cardio || ""} onSaved={onSaved} />

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Travel / Home mode</p>
      <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <PixelGlyph name="airplane" className={profile?.travel_mode ? "" : "opacity-40"} />
          <div>
            <p className="text-sm text-foreground/80">Travel / Home mode</p>
            <p className="text-[11px] font-light text-foreground/40">
              {profile?.travel_mode
                ? "On — today swaps to a bodyweight session."
                : "Swap today for a bodyweight session when you're away."}
            </p>
          </div>
        </div>
        <Switch checked={!!profile?.travel_mode} onCheckedChange={toggleTravel} />
      </div>
      <div className="mt-2">
        <TravelKitToggles profile={profile} onSaved={onSaved} />
      </div>

      <button
        onClick={saveReview}
        disabled={saving}
        className="mt-5 w-full rounded-2xl bg-accent py-3.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save training"}
      </button>

      <RetargetPicker
        open={pickerOpen}
        profile={profile}
        onClose={() => setPickerOpen(false)}
        onSaved={(p) => onSaved?.(p)}
      />
    </div>
  );
}