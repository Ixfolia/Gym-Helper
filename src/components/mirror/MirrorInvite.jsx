import React from "react";
import { Camera, CheckCircle2 } from "lucide-react";

export default function MirrorInvite({ state, onCapture, uploading }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      {state === "invite" ? (
        <>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <p className="text-[10px] uppercase tracking-[0.28em] text-accent/80">Mirror Check</p>
          </div>
          <p className="mt-3 text-sm font-light leading-relaxed text-foreground/70">
            The mirror tells the truth across months, not weeks. One front pose, same lighting if you can — that's all.
          </p>
          <button
            onClick={onCapture}
            disabled={uploading}
            className="mt-4 w-full rounded-2xl bg-accent py-3.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
          >
            {uploading ? "Saving…" : "Capture this month's photo"}
          </button>
        </>
      ) : state === "done" ? (
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <p className="text-sm font-light text-foreground/65">
            This month's Mirror Check is in. See you next month.
          </p>
        </div>
      ) : (
        <p className="text-sm font-light leading-relaxed text-foreground/45">
          Your first weigh-in of the month opens this month's Mirror Check. No rush.
        </p>
      )}
    </div>
  );
}