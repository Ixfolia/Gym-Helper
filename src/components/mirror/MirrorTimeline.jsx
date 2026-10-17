import React from "react";
import { format } from "date-fns";

export default function MirrorTimeline({ photos, signedUrls, selectedId, onSelect }) {
  if (!photos.length) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Timeline</p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {photos.map((p) => {
          const url = signedUrls[p.id];
          const active = p.id === selectedId;
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} className="shrink-0 text-left">
              <div
                className={`h-28 w-20 overflow-hidden rounded-xl border ${
                  active ? "border-accent glow-sm" : "border-white/10"
                }`}
              >
                {url ? (
                  <img src={url} alt={format(new Date((p.date || "").slice(0, 10) + "T12:00:00"), "MMM yyyy")} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full animate-pulse bg-white/5" />
                )}
              </div>
              <p className="mt-1.5 text-[10px] font-light text-foreground/50">
                {format(new Date((p.date || "").slice(0, 10) + "T12:00:00"), "MMM yyyy")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}