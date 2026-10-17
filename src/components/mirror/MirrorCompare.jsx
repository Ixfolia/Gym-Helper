import React from "react";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function PhotoPane({ photo, signedUrls }) {
  const url = photo ? signedUrls[photo.id] : null;
  return (
    <div className="flex-1">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        {url ? (
          <img
            src={url}
            alt={format(parseISO(photo.date), "MMMM yyyy")}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-white/5" />
        )}
      </div>
      <p className="mt-2 text-center text-xs font-light text-foreground/60">
        {photo ? format(parseISO(photo.date), "MMMM yyyy") : "—"}
      </p>
    </div>
  );
}

export default function MirrorCompare({ photos, signedUrls, aId, bId, setA, setB }) {
  const a = photos.find((p) => p.id === aId);
  const b = photos.find((p) => p.id === bId);
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Compare any two months</p>
      <div className="mt-3 flex gap-3">
        <PhotoPane photo={a} signedUrls={signedUrls} />
        <PhotoPane photo={b} signedUrls={signedUrls} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Select value={aId || undefined} onValueChange={setA}>
          <SelectTrigger className="rounded-xl border-white/10 bg-white/[0.02] text-sm font-light">
            <SelectValue placeholder="From" />
          </SelectTrigger>
          <SelectContent>
            {photos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {format(parseISO(p.date), "MMM yyyy")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={bId || undefined} onValueChange={setB}>
          <SelectTrigger className="rounded-xl border-white/10 bg-white/[0.02] text-sm font-light">
            <SelectValue placeholder="To" />
          </SelectTrigger>
          <SelectContent>
            {photos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {format(parseISO(p.date), "MMM yyyy")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}