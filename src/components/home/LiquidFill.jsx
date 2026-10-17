import React from "react";
import { motion, useReducedMotion } from "framer-motion";

// Liquid-fill background layer for the Aesthetic Ascent card. A translucent
// electric-blue "water level" rises to the current phase completion percentage;
// two overlapping SVG wave crests drift horizontally at different speeds (6s and
// 9s) for a gentle living-water surface. Sits behind all card content. The
// level rise eases over 800ms; waves freeze (render static) under
// prefers-reduced-motion.
const BLUE = "30,155,255";

function Wave({ duration, opacity, amplitude = 6, frozen = false }) {
  // One wavelength = 600 viewBox units; the path spans two identical wavelengths
  // so translating the svg by -50% loops seamlessly.
  const d = `M0 10 Q 150 ${10 - amplitude} 300 10 T 600 10 T 900 10 T 1200 10 V 20 H 0 Z`;
  const common = {
    className: "absolute left-0 top-0 h-5 w-[200%]",
    style: { opacity },
    viewBox: "0 0 1200 20",
    preserveAspectRatio: "none",
    "aria-hidden": true,
  };
  if (frozen) {
    return (
      <svg {...common}>
        <path d={d} fill={`rgba(${BLUE},0.22)`} />
      </svg>
    );
  }
  return (
    <motion.svg
      {...common}
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      <path d={d} fill={`rgba(${BLUE},0.22)`} />
    </motion.svg>
  );
}

export default function LiquidFill({ pct = 0 }) {
  const reduce = useReducedMotion();
  const level = Math.max(0, Math.min(100, Number(pct) || 0));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        initial={{ height: "0%" }}
        animate={{ height: `${level}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: `linear-gradient(to bottom, rgba(${BLUE},0.14), rgba(${BLUE},0.05))` }}
      >
        <div className="absolute left-0 right-0 top-0 h-5 -translate-y-1/2">
          <Wave duration={9} opacity={0.45} amplitude={6} frozen={reduce} />
          <Wave duration={6} opacity={0.7} amplitude={6} frozen={reduce} />
        </div>
      </motion.div>
    </div>
  );
}