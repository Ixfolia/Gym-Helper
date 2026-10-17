import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import HabitMiniRow from "@/components/home/HabitMiniRow";

// Habits summary card — today's check, name, flame streak, and a glowing
// weekly completion bar per habit. Extracted so mobile and desktop share it.
export default function HabitsCard({ habits }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">Habits</p>
        <Link to="/habits" className="text-foreground/30 transition-colors hover:text-accent">
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
      <div className="mt-4 space-y-3.5">
        {habits.length ? (
          habits.map((h, i) => <HabitMiniRow key={i} {...h} />)
        ) : (
          <p className="text-xs font-light text-foreground/40">No habits set yet.</p>
        )}
      </div>
    </div>
  );
}