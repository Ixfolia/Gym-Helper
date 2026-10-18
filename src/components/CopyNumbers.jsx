import React, { useEffect, useRef, useState } from "react";
import { ClipboardCopy, Check, Share } from "lucide-react";
import { loadMyNumbersData, buildMyNumbers } from "@/lib/myNumbers";

// The summary is built ahead of the tap: Safari only allows clipboard writes
// that happen immediately inside the tap, not after an await.
function useMyNumbers() {
  const [text, setText] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const t = buildMyNumbers(await loadMyNumbersData());
        if (!cancelled) setText(t);
      } catch {
        if (!cancelled) setText(null);
      }
    };
    refresh();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return text;
}

export default function CopyNumbers({ className = "" }) {
  const text = useMyNumbers();
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const areaRef = useRef(null);
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: show the text so it can be copied by hand.
      setManual(true);
      setTimeout(() => areaRef.current?.select(), 0);
    }
  }

  async function share() {
    if (!text) return;
    try {
      await navigator.share({ text });
    } catch {
      /* share sheet dismissed */
    }
  }

  const btn =
    "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm text-foreground/75 transition-all hover:border-accent/30 disabled:opacity-40";

  return (
    <div className={className}>
      <div className="flex gap-2">
        <button onClick={copy} disabled={!text} className={btn}>
          {copied ? <Check className="h-4 w-4 text-accent" strokeWidth={1.75} /> : <ClipboardCopy className="h-4 w-4" strokeWidth={1.5} />}
          <span>{copied ? "Copied" : "Copy my numbers"}</span>
        </button>
        {canShare && (
          <button onClick={share} disabled={!text} aria-label="Share my numbers" className={`${btn} flex-none px-4`}>
            <Share className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
      {manual && (
        <textarea
          ref={areaRef}
          readOnly
          value={text || ""}
          rows={8}
          className="mt-2 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 font-mono text-[11px] text-foreground/70"
        />
      )}
    </div>
  );
}
