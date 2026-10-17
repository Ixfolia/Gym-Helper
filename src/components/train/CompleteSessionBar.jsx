import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { db } from "@/api/db";
import { Check } from "lucide-react";

// Bottom-of-session completion control. Records one SessionCompletion for
// today (once per day), then transforms into a glowing "Session Complete"
// state with a same-day Undo link.
export default function CompleteSessionBar({
  sessionName,
  journeyPhase,
  completion,
  travel = false,
  onCompleted,
  onUndone,
}) {
  const [busy, setBusy] = useState(false);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const done = !!completion;
  const canUndo = done && completion.date === todayStr;

  async function complete() {
    if (busy || done) return;
    setBusy(true);
    try {
      const rec = await db.entities.SessionCompletion.create({
        date: todayStr,
        session_name: sessionName,
        journey_phase: journeyPhase || "",
        travel: !!travel,
      });
      onCompleted?.(rec);
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!completion) return;
    await db.entities.SessionCompletion.delete(completion.id);
    onUndone?.();
  }

  if (done) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.97, opacity: 0, boxShadow: "0 0 0px rgba(0,212,255,0)" }}
          animate={{
            scale: 1,
            opacity: 1,
            boxShadow: [
              "0 0 0px rgba(0,212,255,0.0)",
              "0 0 52px rgba(0,212,255,0.65)",
              "0 0 24px rgba(0,212,255,0.25)",
            ],
          }}
          transition={{ duration: 0.9, times: [0, 0.4, 1], ease: "easeOut" }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/[0.08] py-4 text-sm font-medium text-accent"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 18 }}
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </motion.span>
          Session Complete
        </motion.div>
        {canUndo && (
          <button
            onClick={undo}
            className="mt-2 text-xs font-light text-foreground/40 transition-colors hover:text-accent"
          >
            Undo
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={complete}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-medium text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-60"
    >
      {busy ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
      ) : (
        "Complete Session"
      )}
    </motion.button>
  );
}