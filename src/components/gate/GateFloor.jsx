import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function GateFloor({ floor }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        floor.met
          ? "border-accent/30 bg-accent/[0.04]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
            floor.met ? "border-accent bg-accent/15 glow-sm" : "border-white/15 bg-background"
          }`}
        >
          {floor.met ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-white/20" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${floor.met ? "text-foreground" : "text-foreground/80"}`}>
            {floor.label}
          </p>
          <p className="mt-0.5 text-[11px] font-light text-foreground/45">
            {floor.met
              ? `Met · ${floor.value}`
              : `Now · ${floor.value} → ${
                  typeof floor.target === "number" ? floor.target : floor.target
                }`}
          </p>
        </div>
      </div>
      {!floor.met && (
        <div className="mt-3 pl-11">
          <p className="text-sm font-light leading-relaxed text-foreground/60">
            {floor.missing}
          </p>
          <p className="mt-1 text-[11px] font-light text-foreground/40">{floor.path}</p>
        </div>
      )}
    </div>
  );
}