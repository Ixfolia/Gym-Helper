import React from "react";
import { motion } from "framer-motion";

// A satisfying on-brand burst that fires the moment a habit is checked off:
// an expanding accent ring plus particles radiating outward. Mounted with a
// fresh key per check so it replays every time.
const PARTICLES = Array.from({ length: 8 });
const RADIUS = 30;

export default function CheckBurst({ fireKey, flash = false }) {
  if (!fireKey) return null;
  return (
    <div
      key={fireKey}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0.7 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute h-14 w-14 rounded-full border-2 border-accent transition-colors duration-200"
        style={flash ? { borderColor: "#34D399" } : undefined}
      />
      <motion.span
        initial={{ scale: 0.6, opacity: 0.4 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
        className="absolute h-14 w-14 rounded-full border border-accent transition-colors duration-200"
        style={flash ? { borderColor: "#34D399" } : undefined}
      />
      {PARTICLES.map((_, i) => {
        const ang = (i / PARTICLES.length) * Math.PI * 2;
        const x = Math.cos(ang) * RADIUS;
        const y = Math.sin(ang) * RADIUS;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x, y, scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute h-1.5 w-1.5 rounded-full bg-accent transition-colors duration-200"
            style={flash ? { backgroundColor: "#34D399" } : undefined}
          />
        );
      })}
    </div>
  );
}