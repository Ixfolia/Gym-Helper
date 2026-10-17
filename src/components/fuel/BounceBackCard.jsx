import React from "react";
import { X } from "lucide-react";

const AMBER = "#F5A623";

// Dismissible, non-blocking "bounce back" card. Dark navy body, amber accent
// border, coach tone — zero shame. Dismiss via the X or the "Locked in" button.
export default function BounceBackCard({ hack, onDismiss }) {
  return (
    <div
      className="rounded-2xl border bg-card p-4"
      style={{ borderColor: AMBER }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-base font-semibold leading-snug text-foreground">
          Big day. Tomorrow we bounce back.
        </p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-foreground/40 transition-colors hover:text-foreground/70"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="mt-3 w-full rounded-xl border py-2.5 text-sm font-semibold"
        style={{ borderColor: AMBER, backgroundColor: "rgba(245,166,35,0.10)", color: AMBER }}
      >
        Locked in
      </button>
    </div>
  );
}