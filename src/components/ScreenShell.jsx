import React from "react";
import { motion } from "framer-motion";

export default function ScreenShell({ eyebrow, title, headerAction, children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto min-h-screen w-full max-w-md px-6 pb-32 pt-14"
    >
      {(eyebrow || headerAction) && (
        <div className="flex items-center justify-between">
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.32em] text-foreground/40">{eyebrow}</p>
          )}
          {headerAction}
        </div>
      )}
      {title && (
        <h1 className="mt-3 font-display text-[2.2rem] font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
      )}
      <div className="mt-12">{children}</div>
    </motion.main>
  );
}