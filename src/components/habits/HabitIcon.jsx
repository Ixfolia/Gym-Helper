import React from "react";
import { ART } from "@/lib/art";

// Position-assigned pixel-art habit markers. The first habit shows the blue
// crown, the second the sunrise-flex, the third the open book, the fourth the
// lightning bolt; additional habits cycle through the four in order. Rendered
// crisp (image-rendering: pixelated), sized ~22px, layered above the circle
// background and below the check state.
export const HABIT_ICONS = ART.habitIcons;

export default function HabitIcon({ index = 0, size = 22, className, style }) {
  const src = HABIT_ICONS[((index % HABIT_ICONS.length) + HABIT_ICONS.length) % HABIT_ICONS.length];
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={className}
      style={{ imageRendering: "pixelated", display: "block", width: size, height: size, ...style }}
    />
  );
}