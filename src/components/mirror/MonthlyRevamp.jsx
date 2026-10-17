import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Sparkles, Activity } from "lucide-react";
import { db } from "@/api/db";

const NOTE =
  "Progress takes time. Keeping your retargeting days exactly as they are is a pro move — as long as they're still aligned with your goal.";
const CONFIRM = "System locked in — see you next month.";

const CARDIO_CHIPS = [
  "Steady-state cardio",
  "HIIT",
  "Walking",
  "Cycling",
  "Swimming",
  "Sports",
  "Jump rope",
];

export default function MonthlyRevamp({ open, profile, onClose, onAdjust, onSaved }) {
  const [phase, setPhase] = useState("options"); // options | cardio | confirmed
  const [style, setStyle] = useState(profile?.cardio_style || "");
  const [freq, setFreq] = useState(profile?.cardio_frequency || 2);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function close() {
    setPhase("options");
    onClose();
  }

  async function saveCardio() {
    if (!style || saving) return;
    setSaving(true);
    try {
      const updated = await db.entities.Profile.update(profile.id, {
        cardio_enabled: true,
        cardio_style: style,
        cardio_frequency: Number(freq),
      });
      setSaving(false);
      onSaved(updated);
      setPhase("confirmed");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-background p-6 pb-8"
      >
        <button onClick={close} className="absolute right-4 top-4 z-10">
          <X className="h-5 w-5 text-foreground/40 hover:text-foreground/70" />
        </button>

        {phase === "options" ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">
              Monthly Revamp
            </p>
            <h3 className="mt-2 font-display text-2xl font-light text-foreground">
              A quick check-in.
            </h3>
            <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/[0.05] p-4">
              <p className="text-sm font-light leading-relaxed text-foreground/70">{NOTE}</p>
            </div>
            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => setPhase("confirmed")}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-4 text-left transition-all hover:border-accent/40"
              >
                <Check className="h-4 w-4 text-accent" strokeWidth={2} />
                <div>
                  <p className="text-sm text-foreground">Keep</p>
                  <p className="text-[11px] font-light text-foreground/45">
                    My retargeting days stay as they are.
                  </p>
                </div>
              </button>
              <button
                onClick={onAdjust}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-4 text-left transition-all hover:border-accent/40"
              >
                <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <div>
                  <p className="text-sm text-foreground">Adjust</p>
                  <p className="text-[11px] font-light text-foreground/45">
                    Change my 1–2 lagging areas.
                  </p>
                </div>
              </button>
              <button
                onClick={() => setPhase("cardio")}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-4 text-left transition-all hover:border-accent/40"
              >
                <Activity className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <div>
                  <p className="text-sm text-foreground">Add cardio</p>
                  <p className="text-[11px] font-light text-foreground/45">
                    Add or adjust a cardio session this week.
                  </p>
                </div>
              </button>
            </div>
          </>
        ) : phase === "cardio" ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">
              Add cardio
            </p>
            <h3 className="mt-2 font-display text-2xl font-light text-foreground">
              Cardio this week
            </h3>
            <p className="mt-3 text-sm font-light leading-relaxed text-foreground/55">
              Pick a style and how many sessions a week. It shows as a light session card and
              counts toward workouts done.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {CARDIO_CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setStyle(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    style === c
                      ? "border-accent text-accent"
                      : "border-white/10 text-foreground/50 hover:border-accent/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Or type your own"
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-foreground outline-none focus:border-accent/50"
            />
            <p className="mt-6 text-[10px] uppercase tracking-[0.24em] text-foreground/40">
              Sessions per week
            </p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setFreq(n)}
                  className={`flex-1 rounded-xl border py-3 text-sm transition-all ${
                    freq === n
                      ? "border-accent bg-accent/[0.06] text-accent"
                      : "border-white/10 text-foreground/55 hover:border-accent/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={saveCardio}
              disabled={!style || saving}
              className="mt-8 w-full rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save cardio"}
            </button>
          </>
        ) : (
          <div className="pt-10 text-center">
            <Check className="mx-auto h-7 w-7 text-accent" strokeWidth={1.5} />
            <h3 className="mt-4 font-display text-2xl font-light text-foreground">{CONFIRM}</h3>
            <button
              onClick={close}
              className="mt-6 w-full rounded-2xl bg-accent py-3.5 text-sm text-primary-foreground glow-sm"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}