import React from "react";
import { calorieStatus, FUEL_COLORS } from "@/lib/fuelColors";

// Calorie delta indicator — renders the goal-driven status line in its
// semantic color, or a neutral slate prompt when no food is logged yet.
export default function FuelDelta({ goal, intake, target, maintenance, className = "" }) {
  const s = calorieStatus({ goal, intake, target, maintenance });
  if (!s) {
    return (
      <p className={`text-xs font-light ${className}`} style={{ color: FUEL_COLORS.slate }}>
        Log your calories to see where today lands.
      </p>
    );
  }
  return (
    <p className={`text-xs font-light ${className}`} style={{ color: s.hex }}>
      {s.text}
    </p>
  );
}