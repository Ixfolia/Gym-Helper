import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import DailyTotalCard from "@/components/fuel/DailyTotalCard";
import AddMealCard from "@/components/fuel/AddMealCard";

// MEALS v2 — two cards under the gauge: a DAILY TOTAL (the day's calories +
// protein, editable inline) and an ADD A MEAL box. Adding a meal never creates a
// visible row; it appends to the day's meals array and the totals become the new
// sums. The "evaporate" moment: on Add, the entered values lift out of the box
// as a cluster of 10–16 small glowing brand-blue pixel squares that stream up
// into the Daily Total card over ~900ms (staggered starts, fading on arrival)
// while the box's contents blur and fade. On arrival the Daily Total pulses a
// blue glow and the numbers + bars count/animate to the new totals; the Add box
// then resets to empty with focus on Calories.
export default function MealsLogger({ calories, protein, animateNonce, saving, onAdd, onEditTotal }) {
  const totalRef = useRef(null);
  const addRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [fading, setFading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [addError, setAddError] = useState(false);

  // Write-before-celebration: the evaporate/count-up fires ONLY after the
  // DailyLog write resolves successfully. On failure the entered values stay in
  // the Add box with an amber "Not saved" line; gauges and streak are untouched.
  async function handleAddStream(cal, pro) {
    let ok = false;
    try {
      ok = await onAdd(cal, pro);
    } catch (e) {
      ok = false;
    }
    if (!ok) {
      setAddError(true);
      setTimeout(() => setAddError(false), 4000);
      return;
    }
    const addRect = addRef.current?.getBoundingClientRect();
    const totalRect = totalRef.current?.getBoundingClientRect();
    if (addRect && totalRect) {
      const n = 10 + Math.floor(Math.random() * 7); // 10–16 squares
      const ps = Array.from({ length: n }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        startX: addRect.left + 12 + Math.random() * Math.max(1, addRect.width - 24),
        startY: addRect.top + addRect.height * (0.45 + Math.random() * 0.45),
        endX: totalRect.left + totalRect.width * (0.25 + Math.random() * 0.5),
        endY: totalRect.top + totalRect.height * (0.35 + Math.random() * 0.3),
        delay: Math.random() * 0.28,
        size: 5 + Math.floor(Math.random() * 4),
      }));
      setParticles(ps);
      setFading(true);
      setTimeout(() => setParticles([]), 1300);
      setTimeout(() => {
        setPulse(true);
        setResetKey((k) => k + 1); // clear the box (still faded)
        setTimeout(() => setPulse(false), 600);
        setTimeout(() => setFading(false), 120); // un-blur the now-empty box
      }, 900);
    } else {
      setResetKey((k) => k + 1);
    }
  }

  return (
    <div className="mt-7 space-y-3">
      <DailyTotalCard
        ref={totalRef}
        calories={calories}
        protein={protein}
        animateNonce={animateNonce}
        onEdit={onEditTotal}
        pulse={pulse}
      />
      <AddMealCard ref={addRef} fading={fading} resetKey={resetKey} saving={saving} error={addError} onAdd={handleAddStream} />

      <div className="pointer-events-none fixed inset-0 z-50">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: p.startX, y: p.startY, opacity: 0 }}
            animate={{ x: p.endX, y: p.endY, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.9, delay: p.delay, ease: "easeOut", opacity: { times: [0, 0.12, 0.7, 1] } }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: p.size,
              height: p.size,
              backgroundColor: "#1E9BFF",
              borderRadius: 1,
              boxShadow: "0 0 8px rgba(30,155,255,0.85), 0 0 16px rgba(30,155,255,0.4)",
              imageRendering: "pixelated",
            }}
          />
        ))}
      </div>
    </div>
  );
}