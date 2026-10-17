import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

function useIsMobile() {
  const [m, setM] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const h = () => setM(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return m;
}

// Consistency master view presented as an overlay instead of an inline expand.
// Desktop: centered panel ~85% of viewport (max 1100px), page dimmed + blurred.
// Mobile: full-screen sheet sliding up from the bottom. Close via X, backdrop
// tap, or Escape. Content scrolls inside the panel. The collapsed Home card is
// untouched; this only renders when `open`.
export default function ConsistencyMasterOverlay({ open, onClose, children }) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="consistency-overlay"
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-0 sm:flex sm:items-center sm:justify-center pointer-events-none">
            <motion.div
              className="pointer-events-auto flex h-full flex-col overflow-hidden border border-white/[0.06] bg-card sm:h-[85vh] sm:w-[85vw] sm:max-w-[1100px] sm:rounded-2xl"
              initial={isMobile ? { y: "100%" } : { scale: 0.96, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              transition={
                isMobile
                  ? { type: "spring", damping: 32, stiffness: 320 }
                  : { duration: 0.22, ease: "easeOut" }
              }
              role="dialog"
              aria-modal="true"
              aria-label="Consistency master view"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">
                  Consistency
                </p>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-foreground/45 transition-colors hover:text-foreground/80"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-3">{children}</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}