import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { streakBadgeFor, streakTierIndex } from "@/lib/streakTiers";

// Pixel-art streak badge assets (uploaded). Diamond is registered for
// future use; tiers currently map to fire / flex / trophy / crown.
export const STREAK_BADGES = {
  fire: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/a795e61f8_012A-badge-fire.png",
  flex: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/c210a3b82_012B-badge-flex.png",
  diamond: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/d7c261b6b_012C-badge-diamond.png",
  trophy: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/97ec24677_012D-badge-trophy.png",
  crown: "https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/63a9b84a1_012E-badge-crown.png",
};

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