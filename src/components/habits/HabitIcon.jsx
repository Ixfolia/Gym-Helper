import React from "react";

// Position-assigned pixel-art habit markers. The first habit shows the blue
// crown, the second the sunrise-flex, the third the open book, the fourth the
// lightning bolt; additional habits cycle through the four in order. Rendered
// crisp (image-rendering: pixelated), sized ~22px, layered above the circle
// background and below the check state.
export const HABIT_ICONS = [
  "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/d07775ec2_016A-habit-slot1-crown-blue.png",
  "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/bbaa25ceb_016B-habit-slot2-sunrise-flex.png",
  "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/2240c3178_016C-habit-slot3-book.png",
  "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/e018e2128_016D-habit-slot4-bolt.png",
];

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