import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import PixelGlyph from "@/components/pixel/PixelGlyph";

// Mirror Check — the latest progress photo as a prominent hero (≥220px) with a
// soft electric-blue glow border, earlier photos as a compact thumbnail row
// beneath. Each photo keeps its date chip and gets a subtle glow whose intensity
// fades with recency: strongest on the most recent, decreasing by rank, none on
// the oldest. Shared by the mobile and desktop dashboards.
const HERO_GLOW = 0.35;

function glowAlpha(rank, total) {
  if (total <= 1) return HERO_GLOW;
  return HERO_GLOW * (1 - rank / (total - 1));
}

function DateChip({ p, pos = "bottom-2 left-2", size = "text-[9px]" }) {
  return (
    <span
      className={`absolute ${pos} rounded bg-black/55 px-1.5 py-0.5 font-mono ${size} tracking-wide text-foreground/75`}
    >
      {format(new Date((p.date || "").slice(0, 10) + "T12:00:00"), "MMM d")}
    </span>
  );
}

export default function MirrorCheckCard({ photos = [], photoUrls = {}, className = "" }) {
  const total = photos.length;

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
          <PixelGlyph name="camera" /> Mirror Check
        </p>
        <Link to="/mirror" className="text-foreground/30 transition-colors hover:text-accent">
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-xs font-light text-foreground/40">No progress photos yet.</p>
      ) : (
        <>
          <Link
            to="/mirror"
            className="group relative mt-4 block overflow-hidden rounded-xl"
            style={{ boxShadow: `0 0 16px rgba(30,155,255,${glowAlpha(0, total)})` }}
          >
            {photoUrls[photos[0].id] ? (
              <img
                src={photoUrls[photos[0].id]}
                alt=""
                className="h-[220px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="h-[220px] w-full animate-pulse bg-white/5" />
            )}
            <DateChip p={photos[0]} />
          </Link>

          {total > 1 && (
            <div className="mt-3 flex gap-2">
              {photos.slice(1).map((p, i) => (
                <Link
                  key={p.id}
                  to="/mirror"
                  className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
                  style={{ boxShadow: `0 0 14px rgba(30,155,255,${glowAlpha(i + 1, total)})` }}
                >
                  {photoUrls[p.id] ? (
                    <img
                      src={photoUrls[p.id]}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-white/5" />
                  )}
                  <DateChip p={p} pos="bottom-1 left-1" size="text-[8px]" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}