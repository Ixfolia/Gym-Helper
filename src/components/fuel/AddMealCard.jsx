import React, { forwardRef, useEffect, useRef, useState } from "react";
import NumberField from "@/components/fuel/NumberField";

// ADD A MEAL — Calories + Protein + "Add meal". Adding a meal only ever adds to
// the day's total (no visible row is created). While the entered values
// "evaporate" up to the Daily Total card (`fading`), the box's contents blur
// and fade; on arrival the parent bumps `resetKey`, which clears the fields and
// returns focus to Calories.
const AddMealCard = forwardRef(function AddMealCard({ fading, resetKey, saving, error, onAdd }, ref) {
  const [cal, setCal] = useState(null);
  const [pro, setPro] = useState(null);
  const calRef = useRef(null);

  useEffect(() => {
    if (resetKey === 0) return;
    setCal(null);
    setPro(null);
    const id = setTimeout(() => calRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [resetKey]);

  const canAdd = (Number(cal) || 0) > 0 && !saving && !fading;

  function handleAdd() {
    if (!canAdd) return;
    onAdd(Number(cal) || 0, Number(pro) || 0);
  }

  return (
    <div ref={ref} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div
        style={{
          filter: fading ? "blur(5px)" : "none",
          opacity: fading ? 0.25 : 1,
          transition: "filter 450ms ease-out, opacity 450ms ease-out",
        }}
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Add a meal</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField label="Calories" value={cal} onChange={setCal} unit="cal" inputRef={calRef} />
          <NumberField label="Protein" value={pro} onChange={setPro} unit="g" />
        </div>
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="mt-3 w-full rounded-xl bg-accent/15 px-4 py-2.5 text-xs font-medium text-accent transition-all hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add meal
        </button>
      </div>
      {error && (
        <p className="mt-2.5 text-[11px] font-light leading-snug" style={{ color: "#F5A623" }}>
          Not saved — check your connection and retry
        </p>
      )}
    </div>
  );
});

export default AddMealCard;