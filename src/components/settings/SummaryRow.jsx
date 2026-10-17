import React from "react";
import { Link } from "react-router-dom";

// Read-only summary row with an optional "Change →" action. `onAction` renders
// a button (e.g. opening a picker); `to` renders a link. Used by the Training
// card for the Lagging areas row.
export default function SummaryRow({ label, value, to, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/35">{label}</p>
        <p className="mt-1 text-sm font-light text-foreground/80 break-words">{value}</p>
      </div>
      {onAction ? (
        <button
          onClick={onAction}
          className="shrink-0 text-[11px] text-foreground/55 transition-colors hover:text-accent"
        >
          Change →
        </button>
      ) : to ? (
        <Link to={to} className="shrink-0 text-[11px] text-foreground/55 transition-colors hover:text-accent">
          Change →
        </Link>
      ) : null}
    </div>
  );
}