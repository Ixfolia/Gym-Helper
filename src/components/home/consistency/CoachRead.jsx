import React, { useMemo } from "react";
import { buildCoachRead } from "@/lib/consistencyRead";

// Inline Coach's Read beneath the Consistency grids — never a popup. Rebuilt
// from live tiles each render. Reward first, then at most a gentle flag; the
// flag body stays in the same calm grey as the rest, with percentages in their
// usual electric-blue. Never shame, never red.
export default function CoachRead({ tiles }) {
  const { praise, warmLine, flags } = useMemo(() => buildCoachRead(tiles), [tiles]);

  const nodes = [];
  praise.forEach((p, i) => {
    nodes.push(
      <span key={`p${i}`}>
        {p.label} is at <span className="text-accent">{p.pct}%</span> {p.ending}{" "}
      </span>
    );
  });
  if (warmLine) {
    nodes.push(<span key="warm">{warmLine} </span>);
  }
  if (flags.length) {
    nodes.push(
      <span key="fp">{flags.length === 1 ? "One to build: " : "Two to build: "}</span>
    );
    flags.forEach((f, i) => {
      nodes.push(
        <span key={`f${i}`}>
          {f.label} is at <span className="text-accent">{f.pct}%</span> {f.ending}{" "}
        </span>
      );
    });
  }

  if (!nodes.length) return null;
  return <p className="text-sm font-light leading-relaxed text-foreground/55">{nodes}</p>;
}