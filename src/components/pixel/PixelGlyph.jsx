import React from "react";
import { ART } from "@/lib/art";

// Shared pixel-art glyph renderer (no container). Crisp scaling via
// image-rendering: pixelated, matching the streak/habit pixel badges.
export const PIXEL_GLYPHS = ART.pixelGlyphs;

export default function PixelGlyph({ name, size = 20, className, style }) {
  const src = PIXEL_GLYPHS[name];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={className}
      style={{ imageRendering: "pixelated", display: "inline-block", width: size, height: size, ...style }}
    />
  );
}