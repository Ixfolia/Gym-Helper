import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, isSameDay, isToday, isYesterday } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function dateLabel(d) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export default function DateNav({ viewDate, onChange }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const onToday = isSameDay(viewDate, today);

  function step(delta) {
    onChange(addDays(viewDate, delta));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => step(-1)}
          aria-label="Previous day"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-foreground/55 transition-colors hover:border-accent/40 hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className={`min-w-[9rem] rounded-full border px-4 py-1.5 text-center text-sm transition-colors ${
                onToday
                  ? "border-white/10 text-foreground/75 hover:border-accent/40"
                  : "border-accent/40 bg-accent/[0.05] text-accent"
              }`}
            >
              {dateLabel(viewDate)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={viewDate}
              onSelect={(d) => {
                if (d) {
                  onChange(d);
                  setOpen(false);
                }
              }}
              disabled={[{ after: today }]}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={() => step(1)}
          disabled={onToday}
          aria-label="Next day"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-foreground/55 transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-foreground/55"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {!onToday && (
        <button
          onClick={() => onChange(today)}
          className="text-[11px] font-light text-accent/70 transition-colors hover:text-accent"
        >
          Back to today
        </button>
      )}
    </div>
  );
}