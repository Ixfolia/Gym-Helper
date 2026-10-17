import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil } from "lucide-react";
import StreakBadge from "@/components/streak/StreakBadge";
import CheckBurst from "@/components/habits/CheckBurst";
import HabitIcon from "@/components/habits/HabitIcon";
import HabitHeatmap from "@/components/habits/HabitHeatmap";
import { buildHeatmap } from "@/lib/habitHeatmap";

export default function HabitSlot({ name, index, done, doneDates, createdDate, onToggle, onRename, streak, weekPct }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name || "");
  const [burst, setBurst] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevDone = useRef(done);

  useEffect(() => {
    if (done && !prevDone.current) {
      setBurst((b) => b + 1);
      setFlash(true);
    }
    prevDone.current = done;
  }, [done]);

  // Green flash on check only: the splash + check circle stay green for ~600ms,
  // then revert to the standard electric-blue checked state. Unchecking skips it.
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(id);
  }, [flash]);

  // Clear the burst shortly after it fires so the element unmounts cleanly.
  useEffect(() => {
    if (!burst) return;
    const id = setTimeout(() => setBurst(0), 950);
    return () => clearTimeout(id);
  }, [burst]);

  function commit() {
    const v = draft.trim();
    setEditing(false);
    if (v && v !== name) onRename(index, v);
    else setDraft(name || "");
  }

  const pct = Math.max(0, Math.min(100, Math.round(weekPct ?? 0)));
  const { columns, stat } = buildHeatmap(doneDates, 15, new Date(), createdDate);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
            placeholder="Name this habit"
            className="w-full rounded-lg border border-accent/40 bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setDraft(name || "");
              setEditing(true);
            }}
            className="group flex items-center gap-2 text-left"
          >
            <span className={`text-base ${name ? "text-foreground" : "text-foreground/30"}`}>
              {name || `Name habit ${index + 1}`}
            </span>
            <Pencil
              className="h-3.5 w-3.5 text-foreground/25 transition-colors group-hover:text-accent"
              strokeWidth={1.5}
            />
          </button>
        )}

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[11px] text-foreground/55">
            {stat.pct}%{" "}
            <span className="text-foreground/35">
              ({stat.done}/{stat.total})
            </span>
          </span>
          <span
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] ${
              streak > 0
                ? "border-accent/30 bg-accent/[0.06] text-accent"
                : "border-white/10 text-foreground/40"
            }`}
          >
            <StreakBadge count={streak} slotKey={`habit:${name}`} size={14} className={streak > 0 ? "" : "opacity-40"} />
            {streak}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <motion.button
            onClick={() => onToggle(name)}
            whileTap={{ scale: 0.9 }}
            className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
              done ? "border-accent bg-accent/15 glow-md" : "border-white/15"
            }`}
          >
            <HabitIcon
              index={index}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
            <AnimatePresence>
              {done && (
                <motion.span
                  key="check"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 16 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check
                    className={`h-7 w-7 transition-colors duration-200 ${flash ? "" : "text-accent text-glow"}`}
                    style={flash ? { color: "#34D399", textShadow: "0 0 24px rgba(52,211,153,0.6)" } : undefined}
                    strokeWidth={2.5}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <CheckBurst fireKey={burst} flash={flash} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.24em] text-foreground/35">This week</p>
            <span className="font-mono text-xs text-accent/80">{pct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-accent glow-sm"
            />
          </div>
          <div className="mt-3">
            <HabitHeatmap columns={columns} />
          </div>
        </div>
      </div>
    </div>
  );
}