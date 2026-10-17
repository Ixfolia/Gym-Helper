import React from "react";
import { parsePrescription } from "@/lib/prescription";

// One exercise row in a workout card: a pixel-style number chip (dark navy
// square, electric-blue mono digit), a bold display name, a row of set pills
// (rep count per set, dark navy fill + thin electric-blue border), and small
// slate suffix chips for modifiers. Completed sets (session done) fill their
// pill solid electric-blue. Prescriptions that don't fit the "N sets:" pill
// pattern fall back to a plain text line so nothing is lost. Shared by the
// standard, express, retarget, and travel lists to keep the Train section
// consistent and compact on mobile.
export default function ExerciseRow({ n, ex, completed = false }) {
  const { sets, modifiers, prose, raw } = parsePrescription(ex.prescription || "");
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] border border-accent/25 bg-secondary font-mono text-[11px] text-accent">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="font-display text-lg font-semibold leading-snug text-foreground">{ex.name}</p>
          {ex.recommended && (
            <span className="rounded-full bg-accent/15 px-1.5 py-px text-[8px] uppercase tracking-[0.12em] text-accent">
              Recommended
            </span>
          )}
        </div>
        {sets.length > 0 ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {sets.map((s, i) => (
                <span
                  key={i}
                  className={`inline-flex min-w-[2.25rem] items-center justify-center rounded-md border px-2 py-0.5 font-mono text-[11px] ${
                    completed
                      ? "border-accent bg-accent text-primary-foreground"
                      : "border-accent/40 bg-secondary text-foreground/80"
                  }`}
                >
                  {s}
                </span>
              ))}
              {modifiers.map((m, i) => (
                <span
                  key={i}
                  className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-foreground/45"
                >
                  {m}
                </span>
              ))}
            </div>
            {prose && <p className="mt-1.5 text-xs font-light leading-relaxed text-foreground/45">{prose}</p>}
          </>
        ) : (
          <p className="mt-1 text-sm font-light leading-relaxed text-foreground/55">{raw ?? ex.prescription}</p>
        )}
        {ex.note && <p className="mt-2 text-xs font-light leading-relaxed text-foreground/40">{ex.note}</p>}
        {ex.alt && <p className="mt-2 text-xs font-light leading-relaxed text-foreground/40">{ex.alt}</p>}
        {ex.altName && (
          <p className="mt-2 text-xs font-light leading-relaxed text-foreground/40">
            Alternative: <span className="text-foreground/55">{ex.altName}</span> — {ex.altRx}
          </p>
        )}
      </div>
    </li>
  );
}