import React, { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Share2, X, Trophy } from "lucide-react";

export default function GateCelebration({ onClose, onShare }) {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.7 },
      colors: ["#00D4FF", "#ffffff"],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative z-10 mx-4 max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-accent/30 bg-card p-6 pb-8 text-center glow-md"
      >
        <button onClick={onClose} className="absolute right-4 top-4">
          <X className="h-4 w-4 text-foreground/40 hover:text-foreground/70" />
        </button>
        <Trophy className="mx-auto h-8 w-8 text-accent" strokeWidth={1.5} />
        <p className="mt-4 text-[10px] uppercase tracking-[0.32em] text-accent">
          Phase 4 unlocked
        </p>
        <h2 className="mt-2 font-display text-2xl font-light text-foreground text-glow">
          You're through the Gate.
        </h2>
        <p className="mt-3 text-sm font-light leading-relaxed text-foreground/60">
          Your first real transformation is certified. The Aesthetic Master awaits — the
          mountain keeps going, and so do you.
        </p>
        <button
          onClick={onShare}
          className="mt-6 w-full rounded-2xl border border-accent/40 bg-accent/[0.06] py-3.5 text-sm text-accent transition-all hover:bg-accent/[0.1]"
        >
          <span className="inline-flex items-center gap-2">
            <Share2 className="h-4 w-4" strokeWidth={1.75} /> Share the moment
          </span>
        </button>
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-foreground/40 transition-colors hover:text-accent"
        >
          Keep climbing
        </button>
      </motion.div>
    </div>
  );
}