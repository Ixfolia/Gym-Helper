import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// The final self-honesty check before the Gate grants. Shown only once every
// objective floor has passed. The member compares their first progress photo
// to their most recent and answers one question, to themselves. "It's worthy"
// proceeds to the existing certificate + celebration; "Not yet" returns to the
// Gate view in a positive state — never the word "failed".
function Photo({ img, label, sub }) {
  return (
    <div className="flex-1">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {img ? (
          <img src={img} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <p className="mt-1.5 text-center text-[11px] font-light text-foreground/55">{label}</p>
      <p className="mt-0.5 text-center text-[10px] font-light text-foreground/35">{sub}</p>
    </div>
  );
}

export default function HonestyCheck({ photos, signedUrls, onWorthy, onNotYet }) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [heldBack, setHeldBack] = useState(false);
  if (!photos || photos.length < 2) return null;
  // The list is sorted -date, so the oldest is last and the newest is first.
  const first = photos[photos.length - 1];
  const latest = photos[0];
  return (
    <div className="rounded-2xl border border-accent/20 bg-white/[0.02] p-5">
      <p className="text-center text-[10px] uppercase tracking-[0.28em] text-foreground/45">
        The final check runs through your own honest eyes.
      </p>
      <div className="mt-5 flex gap-3">
        <Photo
          img={first && signedUrls[first.id]}
          label="First"
          sub={first ? format(parseISO(first.date), "MMM d, yyyy") : ""}
        />
        <Photo
          img={latest && signedUrls[latest.id]}
          label="Now"
          sub={latest ? format(parseISO(latest.date), "MMM d, yyyy") : ""}
        />
      </div>
      <p className="mt-5 text-center text-sm font-light leading-relaxed text-foreground/75">
        Based off the first photo I submitted to the photo I have now — is this worthy of a
        transformation?
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setHeldBack(false);
            setClaimOpen(true);
          }}
          className="rounded-2xl bg-accent py-3.5 text-sm font-medium text-primary-foreground glow-sm transition-all hover:glow-md"
        >
          It's worthy
        </button>
        <button
          onClick={onNotYet}
          className="rounded-2xl border border-white/15 bg-white/[0.02] py-3.5 text-sm font-light text-foreground/70 transition-all hover:border-accent/30"
        >
          Not yet
        </button>
      </div>

      {heldBack && (
        <p className="mt-4 text-center text-sm font-light leading-relaxed text-foreground/65">
          Phase 4 hits different when the transformation is real. Finish this one first — then come
          claim it.
        </p>
      )}

      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              The biggest checkpoint in the system.
            </DialogTitle>
            <DialogDescription className="text-sm font-light leading-relaxed text-foreground/70">
              This marks your first real transformation — the physique you set out to build. Before
              you claim it: have you shared your transformation with the community?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => {
                setClaimOpen(false);
                onWorthy();
              }}
              className="w-full rounded-2xl bg-accent py-3.5 text-sm font-medium text-primary-foreground glow-sm hover:glow-md"
            >
              I've shared it — claim it
            </Button>
            <Button
              onClick={() => {
                setClaimOpen(false);
                setHeldBack(true);
              }}
              variant="outline"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.02] py-3.5 text-sm font-light text-foreground/70 hover:border-accent/30"
            >
              Not yet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}