import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { streakBadgeFor, streakTierIndex } from "@/lib/streakTiers";
import { ART } from "@/lib/art";

// Pixel-art streak badge assets (bundled, see src/lib/art.js). Diamond is registered for
// future use; tiers currently map to fire / flex / trophy / crown.
export const STREAK_BADGES = ART.streakBadges;

const seenKey = (slotKey) => `peak:streak-tier:${slotKey || "default"}`;

function readLast(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? -1 : parseInt(raw, 10);
  } catch {
    return -1;
  }
}

function writeLast(key, tier) {
  try {
    localStorage.setItem(key, String(tier));
  } catch {
    /* ignore */
  }
}

// Inline pixel-art streak badge. The badge is chosen from the streak `count`
// via STREAK_TIERS. The first time a streak crosses UP into a new tier (flex,
// trophy, or crown) the badge plays a one-time scale-up-and-settle pop; a
// reset simply drops back to the matching tier with no animation. Per-slot
// persistence (localStorage) keeps the pop one-time across sessions.
export default function StreakBadge({ count = 0, size = 16, slotKey = "default", alt = "streak", className, style }) {
  const badge = streakBadgeFor(count);
  const tier = streakTierIndex(count);
  const storeKey = seenKey(slotKey);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    const last = readLast(storeKey);
    if (tier > last && tier >= 1) {
      setPop(true);
      writeLast(storeKey, tier);
      const id = setTimeout(() => setPop(false), 420);
      return () => clearTimeout(id);
    }
    writeLast(storeKey, tier);
  }, [tier, storeKey]);

  return (
    <motion.img
      src={STREAK_BADGES[badge] || STREAK_BADGES.fire}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      initial={false}
      animate={pop ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={pop ? { duration: 0.4, ease: "easeOut", times: [0, 0.5, 1] } : { duration: 0 }}
      className={className}
      style={{ imageRendering: "pixelated", display: "inline-block", ...style }}
    />
  );
}