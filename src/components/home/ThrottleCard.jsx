import React from "react";

const AMBER = "#F5A623";

// Dismissible, non-blocking "easy on the throttle" card. Dark navy body, amber
// accent border, coach tone — zero shame, one "Locked in" button to dismiss.
export default function ThrottleCard({ onDismiss }) {
  return (
    <div className="rounded-2xl border bg-card p-4" style={{ borderColor: AMBER }}>
      <p className="font-display text-base font-semibold leading-snug text-foreground">Easy on the throttle.</p>
      <p className="mt-2 text-xs font-light leading-relaxed text-foreground/60">
        {"You've been running a 1,000+ calorie deficit. That pace burns out — around 500 a day is the max that lasts. Bring it back to the band and win the week."}
      </p>
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