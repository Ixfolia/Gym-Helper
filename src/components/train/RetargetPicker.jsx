import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/api/db";
import {
  RETARGET_TAXONOMY,
  normalizePick,
  pickLabel,
  titleCaseArea,
} from "@/lib/splits";
import { Slider } from "@/components/ui/slider";
import { X, Check, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const MAX = 3;
const MIN = 2;

const READING_STEPS = [
  {
    key: "connection",
    title: "Connection",
    body: "Which muscle groups did you struggle to feel during sessions? Which exercises never clicked, even when you focused?",
  },
  {
    key: "development",
    title: "Development",
    body: "Looking in the mirror — which muscle groups lag visually? Where do your photos show the most room to grow?",
  },
  {
    key: "fatigue",
    title: "Fatigue & Recovery",
    body: "Which sessions consistently felt weak or flat? Which days did you feel like you didn't truly train the target muscle?",
  },
];

// Percentage helpers for the priority step — 5% steps, always total 100, min
// 10% per area. Defaults by pick order: 2 areas 65/35, 3 areas 55/30/15.
const snap5 = (v) => Math.round(v / 5) * 5;

function defaultAllocs(n) {
  if (n === 2) return [65, 35];
  if (n === 3) return [55, 30, 15];
  if (n === 1) return [100];
  return new Array(n).fill(Math.round(100 / n));
}

// Rebalance when one area changes so the total stays exactly 100 (5% steps,
// min 10% each). The other areas absorb the difference proportionally to
// their current share, with a 10% floor per area.
function rebalance(picks, index, val) {
  const n = picks.length;
  if (!n) return [];
  const maxVal = 100 - 10 * (n - 1);
  const newVal = Math.min(Math.max(snap5(val), 10), maxVal);
  const result = picks.map((p, i) => (i === index ? newVal : p.allocation ?? 0));
  const othersIdx = picks.map((_, i) => i).filter((i) => i !== index);
  const oc = othersIdx.length;
  if (!oc) return result;
  const remaining = 100 - newVal;
  const otherCur = othersIdx.map((i) => picks[i].allocation ?? 0);
  const sumOther = otherCur.reduce((a, b) => a + b, 0);
  const weights = otherCur.map((v) => (sumOther > 0 ? v : 1));
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const leftover = Math.max(0, remaining - 10 * oc);
  const extras = weights.map((w) => (w / wSum) * leftover);
  const floored = extras.map((e) => Math.floor(e / 5) * 5);
  let diff = leftover - floored.reduce((a, b) => a + b, 0);
  const order = extras
    .map((e, k) => ({ k, r: e - floored[k] }))
    .sort((a, b) => b.r - a.r);
  let k = 0;
  while (diff > 0 && k < order.length) {
    floored[order[k].k] += 5;
    diff -= 5;
    k++;
  }
  othersIdx.forEach((oi, k) => {
    result[oi] = 10 + floored[k];
  });
  return result;
}

// Short label for the split summary: sub-tag label when present, else area label.
function compactLabel(pick) {
  const { area, sub } = normalizePick(pick);
  const a = RETARGET_TAXONOMY.find((t) => t.key === area);
  if (!a) return titleCaseArea(area);
  if (!sub) return a.label;
  const s = a.subs.find((x) => x.key === sub);
  return s ? s.label : a.label;
}

function initialPicks(profile) {
  return (profile?.retarget_areas || [])
    .map((raw) => {
      const n = normalizePick(raw);
      const allocation =
        raw && typeof raw === "object" && raw.allocation != null
          ? Number(raw.allocation)
          : null;
      return { ...n, allocation };
    })
    .filter((p) => p.area)
    .slice(0, MAX);
}

export default function RetargetPicker({ open, profile, onClose, onSaved }) {
  const [step, setStep] = useState(0); // 0 intro, 1-3 reading, 4 pick, 5 priority, 6 confirm
  const [picks, setPicks] = useState(() => initialPicks(profile));
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function close() {
    setStep(0);
    onClose();
  }

  function toggleArea(area) {
    setPicks((cur) => {
      let next;
      if (cur.some((p) => p.area === area)) next = cur.filter((p) => p.area !== area);
      else if (cur.length >= MAX) return cur;
      else next = [...cur, { area, sub: null }];
      return next.map((p) => ({ ...p, allocation: null }));
    });
  }

  function toggleSub(area, sub) {
    setPicks((cur) =>
      cur.map((p) => (p.area === area ? { ...p, sub: p.sub === sub ? null : sub } : p))
    );
  }

  function ensureDefaults() {
    setPicks((cur) => {
      if (!cur.length) return cur;
      if (cur.every((p) => p.allocation != null)) return cur;
      const d = defaultAllocs(cur.length);
      return cur.map((p, i) => ({ ...p, allocation: d[i] }));
    });
  }

  function setAlloc(index, val) {
    setPicks((cur) => {
      if (!cur.length) return cur;
      const next = rebalance(cur, index, val);
      return cur.map((p, i) => ({ ...p, allocation: next[i] }));
    });
  }

  async function generate() {
    const cleaned = picks
      .map((p) => ({ area: p.area, sub: p.sub || "", allocation: p.allocation }))
      .filter((p) => p.area);
    if (cleaned.length < MIN) return;
    setSaving(true);
    try {
      const updated = await db.entities.Profile.update(profile.id, {
        retarget_areas: cleaned,
      });
      setSaving(false);
      setStep(6);
      onSaved(updated);
    } catch {
      setSaving(false);
    }
  }

  const totalSteps = 6; // intro + 3 reading + pick + priority (confirm is after save)
  const canGenerate = picks.length >= MIN;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-[calc(5rem+env(safe-area-inset-bottom))] backdrop-blur-sm"
      onClick={close}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[calc(100dvh-5rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-background"
      >
        <button onClick={close} className="absolute right-4 top-4 z-10">
          <X className="h-5 w-5 text-foreground/40 hover:text-foreground/70" />
        </button>

        {/* Progress dots (hidden on intro + confirm) */}
        {step >= 1 && step <= 5 && (
          <div className="flex shrink-0 items-center justify-center gap-1.5 pt-5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`h-1 rounded-full transition-all ${
                  s === step ? "w-6 bg-accent" : s < step ? "w-1.5 bg-accent/50" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">
                  Retargeting
                </p>
                <h3 className="mt-3 font-display text-2xl font-light leading-tight text-foreground">
                  The split test wasn't just training — it was reconnaissance.
                </h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-foreground/55">
                  Now you know exactly where to press the advantage.
                </p>
                <p className="mt-3 text-sm font-light leading-relaxed text-foreground/45">
                  Retargeting days are precision tools, not bonus sessions. Choose where to point them.
                </p>
              </motion.div>
            )}

            {step >= 1 && step <= 3 && (
              <motion.div
                key={`read-${step}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-accent/70">
                  Step {step} of 3 · {READING_STEPS[step - 1].title}
                </p>
                <h3 className="mt-4 font-display text-xl font-light leading-relaxed text-foreground">
                  {READING_STEPS[step - 1].body}
                </h3>
                <p className="mt-5 text-xs font-light leading-relaxed text-foreground/35">
                  Sit with the question. You'll carry the answer into your picks.
                </p>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="pick"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">
                  Your picks
                </p>
                <h3 className="mt-2 font-display text-2xl font-light text-foreground">
                  Choose 2–3 areas
                </h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-foreground/50">
                  Tap an area to select it. Add a sub-tag to point the work more precisely — optional.
                </p>

                <div className="mt-5 space-y-2.5">
                  {RETARGET_TAXONOMY.map((area) => {
                    const pick = picks.find((p) => p.area === area.key);
                    const selected = !!pick;
                    const disabled = !selected && picks.length >= MAX;
                    return (
                      <div
                        key={area.key}
                        className={`rounded-2xl border transition-all ${
                          selected ? "border-accent/40 bg-accent/[0.05]" : "border-white/10"
                        } ${disabled ? "opacity-40" : ""}`}
                      >
                        <button
                          onClick={() => toggleArea(area.key)}
                          disabled={disabled}
                          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                        >
                          <span
                            className={`text-sm ${selected ? "text-foreground" : "text-foreground/75"}`}
                          >
                            {area.label}
                          </span>
                          <span className="flex items-center gap-2">
                            {pick?.sub && (
                              <span className="text-[11px] font-light text-accent/80">
                                {area.subs.find((s) => s.key === pick.sub)?.label}
                              </span>
                            )}
                            {selected && <Check className="h-4 w-4 text-accent" strokeWidth={2} />}
                          </span>
                        </button>
                        {selected && (
                          <div className="flex flex-wrap gap-1.5 px-4 pb-3.5">
                            {area.subs.map((sub) => {
                              const active = pick?.sub === sub.key;
                              return (
                                <button
                                  key={sub.key}
                                  onClick={() => toggleSub(area.key, sub.key)}
                                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                                    active
                                      ? "border-accent text-accent"
                                      : "border-white/15 text-foreground/55 hover:border-accent/40"
                                  }`}
                                >
                                  {sub.label}
                                  {sub.recommended && (
                                    <span className="rounded-full bg-accent/15 px-1.5 py-px text-[8px] uppercase tracking-[0.12em] text-accent">
                                      Recommended
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                  <p className="text-xs font-light leading-relaxed text-foreground/45">
                    Your picks stay fixed — retargeting days evolve only when your priorities change.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="priority"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">
                  Priority
                </p>
                <h3 className="mt-2 font-display text-2xl font-light text-foreground">
                  Where the volume goes
                </h3>

                <div className="mt-5 space-y-5">
                  {picks.map((p, i) => {
                    const maxVal = 100 - 10 * (picks.length - 1);
                    return (
                      <div key={p.area}>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-foreground/80">
                            {compactLabel(p)}
                            {i === 0 && (
                              <span className="rounded-full bg-accent/15 px-1.5 py-px text-[8px] uppercase tracking-[0.12em] text-accent">
                                Priority 1
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-sm text-accent">{p.allocation ?? 0}%</span>
                        </div>
                        <div className="mt-2">
                          <Slider
                            value={[p.allocation ?? 0]}
                            min={10}
                            max={maxVal}
                            step={5}
                            onValueChange={(v) => setAlloc(i, v[0])}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 text-sm font-light leading-relaxed text-foreground/45">
                  Where should your extra volume go? Priority 1 leads the day.
                </p>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <Sparkles className="h-7 w-7 text-accent" strokeWidth={1.5} />
                <h3 className="mt-4 font-display text-2xl font-light leading-tight text-foreground">
                  Your retargeting days are built
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-foreground/55">
                  Built around <span className="text-accent">{picks.map(pickLabel).join(" + ")}</span>.
                  Every retargeting day now attacks exactly what you want to bring up.
                </p>
                <p className="mt-3 font-mono text-xs text-foreground/55">
                  {picks.map((p) => `${compactLabel(p)} ${p.allocation ?? 0}%`).join(" · ")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 bg-background px-6 pb-[calc(1.75rem+env(safe-area-inset-bottom))] pt-4">
          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm"
            >
              Begin <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
          {step >= 1 && step <= 3 && (
            <div className="flex items-center gap-2.5">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 rounded-2xl border border-white/10 px-4 py-4 text-sm text-foreground/60 transition-colors hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
              )}
              <button
                onClick={() => setStep(step + 1)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm"
              >
                {step === 3 ? "To your picks" : "Continue"}{" "}
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}
          {step === 4 && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1 rounded-2xl border border-white/10 px-4 py-4 text-sm text-foreground/60 transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => {
                  ensureDefaults();
                  setStep(5);
                }}
                disabled={!canGenerate}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm disabled:opacity-40"
              >
                Continue <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}
          {step === 5 && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-1 rounded-2xl border border-white/10 px-4 py-4 text-sm text-foreground/60 transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={generate}
                disabled={!canGenerate || saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm disabled:opacity-40"
              >
                {saving
                  ? "Building…"
                  : `Generate my retargeting days (${picks.length}/${MAX})`}
              </button>
            </div>
          )}
          {step === 6 && (
            <button
              onClick={close}
              className="w-full rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm"
            >
              See my days
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}