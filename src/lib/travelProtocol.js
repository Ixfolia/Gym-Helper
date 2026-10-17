// Travel System v2 — zero-equipment hotel/home protocol.
// NAMING LAW: travel sessions are never labeled with push/pull language — only
// "Travel Workout A/B", "Travel Session", or "Hotel Bodyweight Protocol."
// Internally the two workouts are A and B and alternate per completed session.

export const TRAVEL_EQUIPMENT = [
  { key: "pullup_bar", label: "Pull-up bar" },
  { key: "dumbbells", label: "Dumbbells" },
  { key: "medicine_ball", label: "Medicine ball" },
];

export const TRAVEL_INTRO =
  "Quality > duration — a focused 30 minutes beats a distracted 75. Three sessions a week maintains.";

export const NATURE_CARDIO =
  "Bonus: run somewhere new, hike, or explore the city on foot.";

export const CREATIVE_CARDIO =
  "Creative cardio IS the session — go for a run somewhere new, hike, explore the city on foot.";

const WARMUP = {
  name: "Warmup",
  prescription:
    "Bands: stretch shoulders and warm up. No bands? 2 minutes of arm circles + wall slides + 10 slow ramp-up pushups.",
};

const AB_CIRCUIT = {
  name: "Ab Circuit",
  prescription:
    "1 minute each: leg raises · russian twists · crunches · rowboats · scissors · starfishes · bicycles",
  altName: "Push the intensity",
  altRx: "leg raises to failure with a timer — 80% · 80% · 90-100%",
};

export const THE_COUNTDOWN = {
  name: "The Countdown",
  prescription:
    "Descending ladder, no rest: 60s lying leg raises → 50s flutter kicks → 40s Russian twists → 30s crunches → 20s bicycles → 10s hollow hold. ~3.5 min per round, 1-2 rounds.",
};

export const MED_BALL_CIRCUIT = {
  name: "Medicine Ball Circuit",
  prescription:
    "Russian twists → overhead raises → hold the ball overhead + flutters → drop the ball, crunches → bicycles to wrap. Each station 30s-1min.",
};

export const TRAVEL_WORKOUT_A = {
  letter: "A",
  title: "Travel Workout A",
  blocks: [
    WARMUP,
    {
      name: "Pushup Pyramid",
      prescription:
        "5 sets to failure: 80% · 80% · 90% · 100% · 100% — long rests are fine (10-20 min)",
    },
    {
      name: "Chair Dips",
      prescription: "4 × 12-15",
      altName: "Diamond Pushups",
      altRx: "2-3 sets to failure — final set @ 100%",
    },
    { name: "Leg Raises", prescription: "4 × 1 min — push past 1 minute on the last set" },
    AB_CIRCUIT,
  ],
};

export const TRAVEL_WORKOUT_B = {
  letter: "B",
  title: "Travel Workout B",
  blocks: [
    WARMUP,
    {
      name: "Pull-Ups",
      prescription: "3-4 sets to failure: 80% · 90% · 100%",
      note: "4-set version: 80 · 80 · 90 · 100",
      requires: "pullup_bar",
    },
    { name: "Pike Pushups", prescription: "2-3 sets, 70-90% to failure", note: "Elevate your feet to progress." },
    { name: "Air Squats", prescription: "70-90% to failure per set" },
    {
      name: "Supported Bulgarian Split Squats",
      prescription: "brace one arm on furniture, dumbbell optional — 3 sets: 12-15 · 10-12 · 8-10",
    },
    { name: "Single-Leg Glute Bridges", prescription: "3 × 10-15 per side" },
    { name: "Stair Calf Raises", prescription: "single-leg, 3 × 10-15" },
    { name: "Wall-Sit finisher", prescription: "30s-1min" },
    AB_CIRCUIT,
  ],
};

export const DB_MENU_NOTE =
  "Hotel dumbbells run light — bias the top of your rep ranges and slow the tempo.";

export const DB_MENU = [
  { name: "DB Press", prescription: "4 sets: 18-20 · 10-12 · 5-8 · 18-20", note: "Floor press if no bench." },
  { name: "Single-Arm Bent-Over Rows", prescription: "3-4 sets: 8-12" },
  { name: "DB Lat Pullovers", prescription: "3-4 sets: 8-15" },
  { name: "Lateral Raises", prescription: "3 sets: 15-18 · 12-15 · 10-12" },
  { name: "L Raises", prescription: "3 sets: 10-15" },
  { name: "DB Shoulder Press", prescription: "3 sets: 12-15 · 10-12 · 6-10" },
  { name: "DB Front Raises", prescription: "3 sets: 10-15" },
  { name: "Bicep Curls", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
  { name: "Hammer Curls", prescription: "3 sets: 10-15" },
  { name: "Single-DB Overhead Extension", prescription: "3-4 sets: 8-15" },
  { name: "DB Skull Crushers", prescription: "3-4 sets: 8-15", note: "Flat or incline bench." },
  { name: "Goblet Squats", prescription: "3 sets: 8-15" },
  {
    name: "Supported Bulgarians + DB",
    prescription: "3 sets: 12-15 · 10-12 · 8-10",
    note: "Brace one arm on support, dumbbell in the other hand.",
  },
  { name: "DB Glute Bridge", prescription: "3 sets: 10-15" },
  {
    name: "DB Single-Leg Calf Raises",
    prescription: "3-4 sets: 10-15 — single-leg; slow negative, pause at the stretch",
  },
];

export const RUSH_STACK = {
  title: "Travel Session",
  blocks: [
    AB_CIRCUIT,
    { name: "Pushups", prescription: "3-4 sets, 70-100% to failure, final @ 100%" },
    { name: "Pull-Ups", prescription: "3-4 sets to failure: 80% · 90% · 100%", requires: "pullup_bar" },
  ],
};

// Next travel workout letter: alternates off the last one used (A→B→A→B).
export function getTravelLetter(profile) {
  const last = profile?.last_travel_session;
  return last === "A" ? "B" : "A";
}

// Build the day-like object Train renders for a travel day. Travel + Short on
// time collapses to the Rush Stack. letterOverride lets Train keep the chosen
// workout stable across same-day re-renders (alternation advances on completion).
export function buildTravelDay(profile, shortOnTime = false, letterOverride = null) {
  const letter = letterOverride || getTravelLetter(profile);
  if (shortOnTime) {
    return {
      type: "travel",
      title: RUSH_STACK.title,
      letter,
      isRush: true,
      blocks: RUSH_STACK.blocks,
    };
  }
  const workout = letter === "A" ? TRAVEL_WORKOUT_A : TRAVEL_WORKOUT_B;
  return {
    type: "travel",
    title: workout.title,
    letter,
    isRush: false,
    blocks: workout.blocks,
  };
}