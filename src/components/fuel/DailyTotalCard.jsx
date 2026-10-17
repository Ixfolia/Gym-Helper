import React, { forwardRef, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import NumberField from "@/components/fuel/NumberField";

// DAILY TOTAL — the day's calories + protein, shown as the two truth values.
// Tap either value to edit both inline (Save). On a meal add (animateNonce bump)
// the two numbers count from the previous totals to the new totals over
// ~1.2s ease-out; on a date switch (nonce unchanged) they snap. `pulse` fires
// the one-shot blue box-shadow swell when the evaporated meal squares arrive.
const DailyTotalCard = forwardRef(function DailyTotalCard(
  { calories, protein, animateNonce, onEdit, pulse },
  ref
) {
  const [editing, setEditing] = useState(false);
  const [cal, setCal] = useState(null);
  const [pro, setPro] = useState(null);

  const calMv = useMotionValue(0);
  const proMv = useMotionValue(0);
  const [dispCal, setDispCal] = useState(() => Number(calories) || 0);
  const [dispPro, setDispPro] = useState(() => Number(protein) || 0);
  const prevNonce = useRef(animateNonce);

  useEffect(() => {
    const nc = Number(calories) || 0;
    const np = Number(protein) || 0;
    if (prevNonce.current !== animateNonce && animateNonce > 0) {
      prevNonce.current = animateNonce;
      const c1 = animate(calMv, nc, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate: (v) => setDispCal(Math.round(v)),
      });
      const c2 = animate(proMv, np, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate: (v) => setDispPro(Math.round(v)),
      });
      return () => {
        c1.stop();
        c2.stop();
      };
    }
    prevNonce.current = animateNonce;
    calMv.set(nc);
    proMv.set(np);
    setDispCal(nc);
    setDispPro(np);
     
  }, [calories, protein, animateNonce]);

  function startEdit() {
    setCal(Number(calories) || null);
    setPro(Number(protein) || null);
    setEditing(true);
  }
  function save() {
    setEditing(false);
    onEdit(Number(cal) || 0, Number(pro) || 0);
  }

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      animate={
        pulse
          ? { boxShadow: ["0 0 0px rgba(30,155,255,0)", "0 0 32px rgba(30,155,255,0.55)", "0 0 0px rgba(30,155,255,0)"] }
          : { boxShadow: "0 0 0px rgba(30,155,255,0)" }
      }
      transition={pulse ? { duration: 0.6, ease: "easeOut" } : { duration: 0 }}
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Daily total</p>
      {editing ? (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Calories" value={cal} onChange={setCal} unit="cal" autoFocus />
            <NumberField label="Protein" value={pro} onChange={setPro} unit="g" />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={save}
              className="flex-1 rounded-xl bg-accent py-2.5 text-xs font-medium text-primary-foreground glow-sm transition-all hover:glow-md"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs text-foreground/65 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-end gap-6">
          <button onClick={startEdit} className="text-left">
            <span className="block font-display text-3xl font-bold leading-none text-accent text-glow">
              {dispCal > 0 ? dispCal.toLocaleString() : "—"}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-foreground/40">calories</span>
          </button>
          <button onClick={startEdit} className="text-left">
            <span className="block font-display text-xl font-bold leading-none text-foreground/80">
              {dispPro > 0 ? `${dispPro}g` : "—"}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-foreground/40">protein</span>
          </button>
        </div>
      )}
    </motion.div>
  );
});

export default DailyTotalCard;