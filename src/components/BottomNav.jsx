import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Flame, Dumbbell, CircleCheck, Mountain } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/fuel", label: "Fuel", icon: Flame },
  { to: "/train", label: "Train", icon: Dumbbell },
  { to: "/habits", label: "Habits", icon: CircleCheck },
  { to: "/journey", label: "Journey", icon: Mountain },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group flex flex-1 flex-col items-center gap-1.5 py-3.5 transition-colors duration-300 ${
                isActive ? "text-accent" : "text-foreground/35 hover:text-foreground/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="text-[10px] tracking-[0.18em] uppercase">{label}</span>
                <span
                  className={`h-[2px] w-6 rounded-full transition-all duration-300 ${
                    isActive ? "bg-accent glow-sm" : "bg-transparent"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}