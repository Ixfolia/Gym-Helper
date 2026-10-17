import React, { useState } from "react";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { performReset, refinementSupported } from "@/lib/resetProtocol";

export default function ResetProtocol({ profile, dailyLogs, weighIns, onDone }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const offerRefine = refinementSupported(dailyLogs, weighIns);

  async function reset() {
    setBusy(true);
    try {
      await performReset(profile);
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-6 max-h-[90vh] w-full max-w-md overflow-y-auto px-6 text-center"
      >
        <Leaf className="mx-auto h-7 w-7 text-accent" strokeWidth={1.5} />
        {!done ? (
          <>
            <p className="mt-6 text-[10px] uppercase tracking-[0.32em] text-foreground/40">
              Welcome back
            </p>
            <h1 className="mt-4 font-display text-3xl font-light leading-tight text-foreground">
              Life happened. That's normal.
            </h1>
            <p className="mt-5 text-sm font-light leading-relaxed text-foreground/55">
              Falling off is normal — staying off is the only failure. Nothing is cleared; your
              history is data, never shame. Ready to start a fresh week from today?
            </p>
            <button
              onClick={reset}
              disabled={busy}
              className="mt-8 w-full rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
            >
              {busy ? "Starting…" : "Ready to reset"}
            </button>
            <button
              onClick={() => onDone(null)}
              className="mt-3 w-full text-center text-xs text-foreground/40 transition-colors hover:text-foreground/70"
            >
              Not now
            </button>
          </>
        ) : (
          <>
            <p className="mt-6 text-[10px] uppercase tracking-[0.32em] text-accent">Fresh week</p>
            <h1 className="mt-4 font-display text-3xl font-light leading-tight text-foreground text-glow">
              Starting today.
            </h1>
            <p className="mt-5 text-sm font-light leading-relaxed text-foreground/55">
              Your week restarts now. Step on the scale when you're ready — and we'll recheck your
              targets against your data.
            </p>
            <button
              onClick={() => onDone("/fuel")}
              className="mt-8 w-full rounded-2xl bg-accent py-4 text-sm text-primary-foreground glow-sm transition-all hover:glow-md"
            >
              Step on the scale
            </button>
            {offerRefine && (
              <button
                onClick={() => onDone("/fuel/maintenance")}
                className="mt-3 w-full rounded-2xl border border-accent/40 py-3.5 text-sm text-accent transition-all hover:bg-accent/[0.06]"
              >
                Recheck my targets
              </button>
            )}
            <button
              onClick={() => onDone(null)}
              className="mt-3 w-full text-center text-xs text-foreground/40 transition-colors hover:text-foreground/70"
            >
              Back to the dashboard
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}