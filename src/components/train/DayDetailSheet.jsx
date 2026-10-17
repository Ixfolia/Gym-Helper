import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import SessionCard from "./SessionCard";

export default function DayDetailSheet({ weekday, day, custom, isToday, onBuild, onClose, completed = false, shortOnTime = false, profile, onCardioSaved }) {
  if (!day) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-background p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10">
          <X className="h-5 w-5 text-foreground/40 hover:text-foreground/70" />
        </button>
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/35">
          {weekday}
          {isToday ? " · today" : ""}
        </p>
        <div className="mt-4">
          <SessionCard day={day} isToday={isToday} custom={custom} completed={completed} onBuild={onBuild} shortOnTime={shortOnTime} profile={profile} onCardioSaved={onCardioSaved} />
        </div>
      </motion.div>
    </div>
  );
}