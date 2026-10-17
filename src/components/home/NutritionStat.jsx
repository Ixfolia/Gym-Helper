import React, { useLayoutEffect, useRef, useState } from "react";

// One big number with a small parenthetical to its right, forced onto a single
// line. The parenthetical is ~42% of the big number's size and baseline-aligned
// so it rests slightly below the number. If the pair would overflow the column,
// the big number's font-size scales down until it fits — measured against an
// off-screen base-size copy so the already-scaled output never oscillates.
const BASE = 1.5; // rem
const PAR_RATIO = 0.42;

export default function NutritionStat({ big, paren, color, glow }) {
  const wrapRef = useRef(null);
  const measureRef = useRef(null);
  const [size, setSize] = useState(BASE);

  useLayoutEffect(() => {
    function fit() {
      const wrap = wrapRef.current;
      const m = measureRef.current;
      if (!wrap || !m) return;
      const avail = wrap.clientWidth;
      const natural = m.scrollWidth;
      if (natural > avail && natural > 0) {
        setSize(Math.max(0.6, (BASE * avail) / natural));
      } else {
        setSize(BASE);
      }
    }
    fit();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(fit);
      if (wrapRef.current) ro.observe(wrapRef.current);
    }
    return () => ro && ro.disconnect();
  }, [big, paren]);

  return (
    <div ref={wrapRef} className="mt-1 min-w-0">
      <div className="flex items-baseline gap-x-1.5 whitespace-nowrap">
        <span
          className="font-mono font-medium leading-none text-accent text-glow"
          style={{ fontSize: `${size}rem` }}
        >
          {big}
        </span>
        {paren && (
          <span
            className="font-mono leading-none"
            style={{ fontSize: `${size * PAR_RATIO}rem`, color, textShadow: glow }}
          >
            {paren}
          </span>
        )}
      </div>
      {/* Hidden measure at base size — gives the natural pair width so we can
          downscale the big number until it fits, without re-measuring the
          already-scaled output. */}
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 -z-10 invisible whitespace-nowrap font-mono"
        style={{ display: "inline-flex", alignItems: "baseline", gap: "0.375rem", fontSize: `${BASE}rem` }}
      >
        <span className="font-mono font-medium leading-none">{big}</span>
        {paren && (
          <span className="font-mono leading-none" style={{ fontSize: `${BASE * PAR_RATIO}rem` }}>
            {paren}
          </span>
        )}
      </span>
    </div>
  );
}