import React from "react";
import { Link } from "react-router-dom";

// Read-only list of the member's habit names. Renaming happens on the Habits
// page (renaming here would orphan existing habit logs), so this card only
// links out.
export default function HabitsCard({ profile }) {
  const habits = (profile?.habits || []).filter((h) => h);
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <p className="text-sm text-foreground">Habits</p>
      <p className="text-[11px] font-light text-foreground/45">Your tracked habits.</p>
      <div className="mt-4 space-y-2">
        {habits.length ? (
          habits.map((h, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm font-light text-foreground/80"
            >
              {h}
            </div>
          ))
        ) : (
          <p className="text-sm font-light text-foreground/40">No habits set.</p>
        )}
      </div>
      <Link
        to="/habits"
        className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-foreground/70 transition-colors hover:border-accent/30"
      >
        <span>Manage on Habits</span>
        <span className="text-accent">→</span>
      </Link>
    </div>
  );
}