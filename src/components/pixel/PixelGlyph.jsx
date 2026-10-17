import React from "react";

// Shared pixel-art glyph renderer (no container). Crisp scaling via
// image-rendering: pixelated, matching the streak/habit pixel badges.
export const PIXEL_GLYPHS = {
  camera: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/a153a23d2_017-icon-camera.png",
  airplane: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/f44094241_020-icon-airplane.png",
  stopwatch: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/23ac7191c_020-icon-stopwatch.png",
};

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