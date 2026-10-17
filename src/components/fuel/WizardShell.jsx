import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export default function WizardShell({ step, total, title, onBack, children, onNext, nextLabel, nextDisabled, saving }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto min-h-screen w-full max-w-md px-6 pb-32 pt-10"
    >
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-foreground/40 transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} /> Back
          </button>
        ) : (
          <span />
        )}
        <span className="font-mono text-[11px] text-foreground/35">
          {step} / {total}
        </span>
      </div>

      <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>

      <h1 className="mt-8 font-display text-[1.7rem] font-light leading-tight tracking-tight text-foreground">
        {title}
      </h1>

      <div className="mt-8 space-y-4">{children}</div>

      <button
        onClick={onNext}
        disabled={nextDisabled || saving}
        className="mt-8 flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-4 text-sm tracking-wide text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40 disabled:shadow-none"
      >
        {saving ? "Saving…" : nextLabel || "Continue"}
      </button>
    </motion.main>
  );
}