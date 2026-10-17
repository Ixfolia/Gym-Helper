// Peak System — split programs. The split content is the program: never user-editable.
// [EXPRESS] / [APP] notes are stored on each day (express / app fields) but never displayed.

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COACH_NOTE =
  "Prioritize form over moving heavy weight — this split is built to have a ton of variance with the weight you choose. It took over 10 years as a natural lifter to build up to this level of volume: it's okay for an intermediate lifter to decrease the volume or do 3 sets instead of 4. Configure the workout in ways that are optimal for you.";

// ---- Track B — Peak Aesthetic Split (4-6 day) ----
const TRACK_B = [
  {
    day: 1,
    title: "Chest + Triceps",
    type: "standard",
    exercises: [
      { n: 1, name: "Bench Press (or press movement)", prescription: "4 sets: 18-20 warmup · 10-12 · 5-8 · 18-20 (fatigue set)", note: "Spotter needed — no spotter? Switch to a press machine alternative." },
      { n: 2, name: "Kneeling High-to-Low Cable Flys", prescription: "4 sets: 15-18 · 12-15 · 10-12 · 8-10 (4th optional)" },
      { n: 3, name: "Chest Fly (pec deck machine, or other fly variations)", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 4, name: "Incline Press (or other alternative machines)", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 5, name: "Tricep Rope Extensions", prescription: "3 sets: 15-18 · 12-15 · 10-12", note: "Superset pair — shortened rest between these two." },
      { n: 6, name: "Tricep Straight Bar Pushdowns", prescription: "3 sets: 15-18 · 12-15 · 10-12", note: "Superset pair — shortened rest between these two." },
      { n: 7, name: "Tricep Kickbacks (single arm, cable attachment)", prescription: "3 sets: 12-15 · 12-15 · 10-12" },
      { n: 8, name: "Dips", prescription: "3 sets to failure: 80-90% · 80-90% · 90-100%" },
    ],
    express: {
      exercises: [
        { name: "Bench Press (or press movement)", prescription: "2 sets: 18-20 warmup · 10-12", note: "Spotter needed — no spotter? Switch to a press machine alternative." },
        { name: "Kneeling High-to-Low Cable Flys", prescription: "2 sets: 15-18 · 12-15" },
        { name: "Tricep Rope Extensions", prescription: "2 sets: 15-18 · 12-15" },
        { name: "Dips", prescription: "2 sets to failure: 80-90% · 90-100%" },
      ],
    },
  },
  {
    day: 2,
    title: "Back + Biceps",
    type: "standard",
    exercises: [
      { n: 1, name: "Lat Pulldown, Wide Grip", prescription: "3 sets: 10-15 · 10-15 · 10-15" },
      { n: 2, name: "Lat Pulldown, Close Grip", prescription: "4 sets: 12-16 · 12-15 · 12-15 · 12-15" },
      { n: 3, name: "Single Arm Rows", prescription: "3-4 sets: 15-20 (warmup) · 12-15 · 12-15 · 8-10 (4th set optional — can sub out the warmup or the 4th set)" },
      { n: 4, name: "Bicep Standing Curls", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 5, name: 'Half-and-Half Curls (aka "21s")', prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 6, name: "Preacher Curls", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 7, name: "Pull-Ups", prescription: "3 sets to failure: 80-90% · 80-90% · 90-100%" },
    ],
    express: {
      exercises: [
        { name: "Lat Pulldown, Wide Grip", prescription: "2 sets: 10-15 · 10-15" },
        { name: "Single Arm Rows", prescription: "2 sets: 12-15 · 12-15" },
        { name: "Bicep Standing Curls", prescription: "2 sets: 12-15 · 12-15" },
        { name: "Pull-Ups", prescription: "2 sets to failure: 80-90% · 90-100%" },
        {
          name: "Bicep Finisher",
          prescription: "2-3 sets",
          note: "Alternating single-arm curls — 5 reps one arm while the other holds a 90° isometric, switch arms, repeat. Same pattern with hammer curls. Finish: double-arm hammer curls to failure.",
        },
      ],
    },
  },
  {
    day: 3,
    title: "Shoulders + Abs",
    type: "standard",
    exercises: [
      { n: 1, name: "Shoulder Press", prescription: "3 sets: 12-15 · 10-12 · 6-10" },
      { n: 2, name: "Lateral Raises (front × side raise superset)", prescription: "3 sets: 15-18 · 12-15 · 10-12" },
      { n: 3, name: "Chest-Supported Lateral Raise Supermans", prescription: "3-4 sets: 15-20 · 15-20 · 15-20 (4th optional)" },
      { n: 4, name: "Cable Machine Lateral Raises", prescription: "3 sets + burnout: 15-18 · 12-15 · 10-12 · Burnout (set to the lightest weight)" },
      {
        n: 5,
        name: "AB CIRCUIT",
        prescription: "1 minute each: leg raises · russian twists · crunches · rowboats · scissors · starfishes · bicycles",
        alt: "ALTERNATIVE ab circuit (PUSH THE INTENSITY): leg raises to failure with a timer — 80% · 80% · 90-100%",
      },
    ],
    express: {
      exercises: [
        { name: "Lateral Raises (front × side raise superset)", prescription: "2 sets: 15-18 · 12-15" },
        { name: "Cable Machine Lateral Raises", prescription: "2 sets: 15-18 · 12-15" },
        {
          name: "AB CIRCUIT",
          prescription: "1 minute each: leg raises · russian twists · crunches · rowboats · scissors · starfishes · bicycles",
          alt: "ALTERNATIVE ab circuit (PUSH THE INTENSITY): leg raises to failure with a timer — 80% · 80% · 90-100%",
        },
      ],
    },
  },
  {
    day: 4,
    title: "Legs",
    type: "standard",
    banner: "Prioritize form first. Judge your knee health honestly. Let progressive overload come naturally.",
    exercises: [
      { n: 1, name: "Bulgarian Split Squat", prescription: "3 sets: 12-15 · 10-12 · 8-10" },
      { n: 2, name: "Hack Squat (or regular squat; can sub bulgarian or split squat)", prescription: "3 sets: 12-15 · 10-12 · 8-10" },
      { n: 3, name: "Leg Press Machine", prescription: "4 sets: 18-20 · 10-12 · 8-10 · 8-10" },
      { n: 4, name: "Quad Curl Machine (can sub bulgarian or split squat)", prescription: "3 sets: 18-20 · 12-15 · 8-10" },
      { n: 5, name: "DROP SET — QUAD EXTENSION", prescription: "On the Quad Extension ONLY — never drop-set the hamstrings. Set weight to 100 (or a weight with 10 notches to drop): 10 reps, drop, 10 reps, drop… repeat until the weight is at zero (a 10-SET DROPSET). Superset with Hamstring Curl Machine — 4 sets: 18-20 · 12-15 · 8-10 · 5-8" },
    ],
    express: {
      exercises: [
        { name: "Hack Squat", prescription: "2 sets: 12-15 · 10-12" },
        { name: "Quad Curl Machine", prescription: "2 sets: 18-20 · 12-15" },
        { name: "Hamstring Curl Machine", prescription: "2 sets: 18-20 · 12-15" },
      ],
      note: "Run as a superset-style flow — minimal rest between machines.",
    },
  },
  {
    day: 5,
    title: "Retargeting Day 1",
    type: "retarget",
    description:
      "A day spent on YOUR priority muscle groups — the areas you feel are lacking or want to bring up. You can also mix in workouts you missed this week, or light stretching/rehab.",
    app: "this day gets customized by the Retargeting Picker later.",
  },
  {
    day: 6,
    title: "Retargeting Day 2 (The 50/50 Day)",
    type: "retarget",
    description:
      "If you make it to Day 6 — congrats! This day is a 50/50 split: 50% retargeting your priority muscle groups AGAIN (retargeting a muscle group 2-3× per week is extremely effective), and 50% whatever you'd like — cardio, testing different workout styles, activities you enjoy.",
    app: "second retargeting session + the cardio-of-choice slot.",
  },
  {
    day: 7,
    title: "Rest / Active Health Day",
    type: "rest",
    description: "Take a rest and recharge your body.",
  },
];

// ---- Track A — Elite 3-5 Day Aesthetic Split ----
const TRACK_A = [
  {
    day: 1,
    title: "Chest + Triceps + Shoulders",
    type: "standard",
    exercises: [
      { n: 1, name: "Bench Press (or press movement)", prescription: "4 sets: 18-20 warmup · 10-12 · 5-8 · 18-20 (fatigue set)", note: "Spotter needed — no spotter? Switch to a press machine alternative." },
      { n: 2, name: "Overhead (Shoulder) Press", prescription: "3 sets: 12-15 · 10-12 · 6-10", note: "A 75° bench angle is okay — you'll get some chest activation, but it's still mainly shoulders." },
      { n: 3, name: "Kneeling High-to-Low Cable Flys", prescription: "4 sets: 15-18 · 12-15 · 10-12 · 8-10" },
      { n: 4, name: "Chest Fly (pec deck machine, or other fly variations)", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 5, name: "Tricep Rope Extensions", prescription: "3 sets: 15-18 · 12-15 · 10-12", note: "Superset pair — shortened rest between these two." },
      { n: 6, name: "Tricep Straight Bar Pushdowns", prescription: "3 sets: 15-18 · 12-15 · 10-12", note: "Superset pair — shortened rest between these two." },
      { n: 7, name: "Tricep Kickbacks (single arm, cable attachment)", prescription: "3 sets: 12-15 · 12-15 · 10-12" },
      { n: 8, name: "Dips", prescription: "3 sets to failure: 80-90% · 80-90% · 90-100%" },
      { n: 9, name: "Lateral Raises (front × side raise superset)", prescription: "3 sets: 15-18 · 12-15 · 10-12" },
      { n: 10, name: "Cable Machine Lateral Raises", prescription: "3 sets + burnout: 15-18 · 12-15 · 10-12 · Burnout (lightest weight)" },
    ],
    express: {
      exercises: [
        { name: "Bench Press (or press movement)", prescription: "2 sets: 18-20 warmup · 10-12", note: "Spotter needed — no spotter? Switch to a press machine alternative." },
        { name: "Overhead (Shoulder) Press", prescription: "2 sets: 12-15 · 10-12" },
        { name: "Kneeling High-to-Low Cable Flys", prescription: "2 sets: 15-18 · 12-15" },
      ],
    },
  },
  {
    day: 2,
    title: "Back + Biceps",
    type: "standard",
    exercises: [
      { n: 1, name: "Lat Pulldown, Wide Grip", prescription: "3 sets: 10-15 · 10-15 · 10-15" },
      { n: 2, name: "Lat Pulldown, Close Grip", prescription: "4 sets: 12-16 · 12-15 · 12-15 · 12-15" },
      { n: 3, name: "Single Arm Rows", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 4, name: "Bicep Standing Curls", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 5, name: 'Half-and-Half Curls (aka "21s")', prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 6, name: "Preacher Curls", prescription: "3 sets: 12-15 · 12-15 · 12-15" },
      { n: 7, name: "Pull-Ups", prescription: "3 sets to failure: 80-90% · 80-90% · 90-100%" },
    ],
    express: {
      exercises: [
        { name: "Lat Pulldown, Wide Grip", prescription: "2 sets: 10-15 · 10-15" },
        { name: "Single Arm Rows", prescription: "2 sets: 12-15 · 12-15" },
        { name: "Bicep Standing Curls", prescription: "2 sets: 12-15 · 12-15" },
        { name: "Pull-Ups", prescription: "2 sets to failure: 80-90% · 90-100%" },
        {
          name: "Bicep Finisher",
          prescription: "2-3 sets",
          note: "Alternating single-arm curls — 5 reps one arm while the other holds a 90° isometric, switch arms, repeat. Same pattern with hammer curls. Finish: double-arm hammer curls to failure.",
        },
      ],
    },
  },
  {
    day: 3,
    title: "Legs (+ Abs)",
    type: "standard",
    banner: "Prioritize form first. Judge your knee health honestly. Let progressive overload come naturally.",
    exercises: [
      { n: 1, name: "Bulgarian Split Squat", prescription: "3 sets: 12-15 · 10-12 · 8-10" },
      { n: 2, name: "Hack Squat (or regular squat; can sub bulgarian or split squat)", prescription: "3 sets: 12-15 · 10-12 · 8-10" },
      { n: 3, name: "Leg Press Machine", prescription: "4 sets: 18-20 · 10-12 · 8-10 · 8-10" },
      { n: 4, name: "Quad Curl Machine (can sub bulgarian or split squat)", prescription: "3 sets: 18-20 · 12-15 · 8-10" },
      { n: 5, name: "DROP SET — QUAD EXTENSION", prescription: "10-set dropset on the Quad Extension ONLY (10 reps per drop, weight to zero) — never drop-set the hamstrings. Superset with Hamstring Curl Machine." },
      {
        n: 6,
        name: "AB CIRCUIT",
        prescription: "1 minute each: leg raises · russian twists · crunches · rowboats · scissors · starfishes · bicycles",
        alt: "ALTERNATIVE (PUSH THE INTENSITY): leg raises to failure with a timer — 80% · 80% · 90-100%",
      },
    ],
    express: {
      exercises: [
        { name: "Hack Squat", prescription: "2 sets: 12-15 · 10-12" },
        { name: "Quad Curl Machine", prescription: "2 sets: 18-20 · 12-15" },
        { name: "Hamstring Curl Machine", prescription: "2 sets: 18-20 · 12-15" },
        {
          name: "AB CIRCUIT",
          prescription: "1 minute each: leg raises · russian twists · crunches · rowboats · scissors · starfishes · bicycles",
          alt: "ALTERNATIVE (PUSH THE INTENSITY): leg raises to failure with a timer — 80% · 80% · 90-100%",
        },
      ],
      note: "Run as a superset-style flow — minimal rest between machines.",
    },
  },
  {
    day: 4,
    title: "Retargeting Day 1",
    type: "retarget",
    description:
      "Your priority muscle groups — the areas you feel are lacking or want to bring up. Choose what is optimal for YOUR body. Mix in missed workouts or stretching/rehab.",
    app: "customized by the Retargeting Picker later.",
  },
  {
    day: 5,
    title: "Retargeting Day 2 (The 50/50 Day)",
    type: "retarget",
    description:
      "50/50 split between retargeting your priority muscle groups / active rest / cardio (activities you enjoy).",
    app: "second retargeting session + cardio-of-choice slot.",
  },
  {
    day: "rest",
    title: "Rest / Active Day",
    type: "rest",
    description: "Take a rest and recharge your body.",
  },
];

const SCHEDULES = {
  "3-5": { track: "A", days: TRACK_A, schedule: ["1", "2", "3", "4", "5", "rest", "rest"] },
  "4-6": { track: "B", days: TRACK_B, schedule: ["1", "2", "3", "4", "5", "6", "rest"] },
};

export const TRACK_META = [
  { cadence: "3-5", track: "A", label: "3-5 days", name: "Elite 3-5 Day Aesthetic Split" },
  { cadence: "4-6", track: "B", label: "4-6 days", name: "Peak Aesthetic Split (4-6 Day)" },
];

export function getTrack(cadence) {
  return cadence === "4-6" ? "B" : "A";
}

export function getDays(cadence) {
  return SCHEDULES[cadence].days;
}

export function getSchedule(cadence) {
  return SCHEDULES[cadence].schedule;
}

function findDay(cadence, key) {
  const days = getDays(cadence);
  if (key === "rest") return days.find((d) => d.type === "rest");
  return days.find((d) => String(d.day) === String(key));
}

export function defaultSchedule(cadence) {
  return SCHEDULES[cadence].schedule.slice();
}

export function trackSwitchPayload(cadence) {
  return { cadence, track: getTrack(cadence), week_schedule: defaultSchedule(cadence) };
}

export function getDayByKey(cadence, key) {
  return findDay(cadence, key);
}

export function getToday(cadence, schedule) {
  const sch = schedule || SCHEDULES[cadence].schedule;
  const idx = (new Date().getDay() + 6) % 7;
  const key = sch[idx];
  return { weekday: WEEKDAYS[idx], key, day: findDay(cadence, key) };
}

export function getWeek(cadence, schedule) {
  const sch = schedule || SCHEDULES[cadence].schedule;
  return WEEKDAYS.map((weekday, i) => ({
    weekday,
    key: sch[i],
    day: findDay(cadence, sch[i]),
  }));
}

// ---- Retargeting Bank (v2) ----
// Area-level entries serve every sub-tag of their area; sub-tagged entries
// serve their sub-tag only. Entries with `recommended: true` render the same
// "Recommended" chip as the Lower Abs sub-tag. Heavy barbell back squats are
// excluded by design. Cardio is NOT a lagging area — it lives in the
// Retargeting Day 2 (50/50) slot, configured separately.
export const RETARGET_BANK = {
  chest: {
    area: [
      { name: "Pushups", prescription: "3-4 sets: 70-100% to failure — last 1-2 sets @ 90%, final set @ 100%", recommended: true },
      { name: "Incline/Decline Pushups", prescription: "3-4 sets: 70-90% to failure", note: "Feet elevated = upper-chest bias. Hands on a slight box (keep it small) = lower-chest bias. Standard pushups are favored over both." },
    ],
    subs: {
      mid: [
        { name: "Flat Press Machine", prescription: "4 sets: 10-15 · 10-12 · 5-8 · burnout", note: "No spotter needed — safe to push past failure on the final set." },
        { name: "DB Press", prescription: "4 sets: 18-20 · 10-12 · 5-8 · 18-20" },
      ],
      lower: [
        { name: "Decline Bench", prescription: "4 sets: 18-20 · 10-12 · 5-8 · 18-20", note: "Spotter needed — no spotter? Sub it or be safe." },
      ],
    },
  },
  back: {
    subs: {
      width: [
        { name: "Lat Pullovers", prescription: "3-4 sets: 8-15", recommended: true },
      ],
      thickness: [
        { name: "Bent-Over Single-Arm DB Rows", prescription: "3-4 sets: 8-12", note: "Form critical. Once form is mastered, volume can drop slightly." },
      ],
      // traps: dedicated move (DB Shrugs); the general-back pool remains the
      // backup via supplementPool (resolveSubExercises("back", null)).
      traps: [
        { name: "DB Shrugs", prescription: "3 sets: 10-15 — slow squeeze at the top", recommended: true },
      ],
    },
  },
  shoulders: {
    subs: {
      rear_delts: [
        { name: "Archer Pulls", prescription: "3 sets: 8-15", recommended: true },
        { name: "Reverse Seated Flies (Pec Deck)", prescription: "3-4 sets: 8-15" },
        { name: "Cross-Cable Rear Delt Flies", prescription: "3-4 sets: 8-15" },
      ],
      side_delts: [
        { name: "L Raises", prescription: "3 sets: 10-15", recommended: true },
      ],
      front_delts: [
        { name: "Cable Front Raises", prescription: "3 sets: 10-15" },
        { name: "Plate Raises", prescription: "3 sets: 8-15" },
      ],
    },
  },
  arms: {
    subs: {
      triceps: [
        { name: "Skull Crushers", prescription: "3-4 sets: 8-15", note: "Flat or incline bench. Prioritize form." },
        { name: "Overhead Extensions", prescription: "3-4 sets: 8-15", note: "Straight bar overhead, or single-arm with a cable attachment." },
        { name: "Cross-Body Single-Arm Cable Extensions", prescription: "3 sets: 8-15" },
        { name: "Diamond Pushups", prescription: "2-3 sets to failure — final set @ 100%" },
      ],
      biceps: [
        { name: "Bayesian Cable Curl", prescription: "3-4 sets: 8-15", recommended: true },
        { name: "Standing EZ-Bar Curls", prescription: "3-4 sets: 8-15", note: "Wide, close, or overhand-neutral grip — pick by preference; drop the weight on overhand-neutral." },
        { name: "Standing Cable Curls", prescription: "3-4 sets: 8-15" },
        { name: "Spider Curls", prescription: "3-4 sets: 8-15" },
      ],
    },
  },
  abs: {
    subs: {
      lower_abs: [
        { name: "Lying Leg Raises", prescription: "3-4 sets × 1 minute — increase the time as your development improves", recommended: true },
        { name: "Dragon Flags", prescription: "3 sets: controlled reps to near-failure", note: "ADVANCED ONLY — for already-built abdomens. Supported on an incline bench." },
        { name: "Hanging Leg Raises", prescription: "3 sets: controlled reps to near-failure", note: "ADVANCED ONLY — hang from a pull-up bar." },
      ],
      mid_upper: [
        { name: "Weighted Cable Crunches / Crunch Machine", prescription: "3-4 sets: 10-15", note: "Not preferred unless you have strong mind-to-muscle — the circuit and leg raises are preferred at every level." },
      ],
    },
  },
  legs: {
    area: [
      { name: "Stairmaster (leg-day finisher)", prescription: "10-15 min at the end of the leg workout", recommended: true },
    ],
    subs: {
      quads: [
        { name: "Goblet Squats", prescription: "3 sets: 8-15", note: "Clean form first." },
        { name: "High-Volume Air Squats", prescription: "3-4 sets: 70-90% to failure", note: "For form pain points." },
      ],
      glutes: [
        { name: "Supported Bulgarian Split Squats", prescription: "3 sets: 12-15 · 10-12 · 8-10", note: "If you struggle with Bulgarians: brace one arm on support, dumbbell in the other hand." },
        { name: "DB Hip Thrust / Glute Bridge", prescription: "3 sets: 10-15" },
      ],
      calves: [
        { name: "Standing Calf Raises", prescription: "3-4 sets: 10-15 — single-leg at a time preferred; high volume — rep it out; don't overthink the negative", recommended: true },
        { name: "Calf Raise Machine", prescription: "3-4 sets: 8-15", note: "Standing single-leg calf raises preferred." },
      ],
    },
  },
};

// Map legacy sub-region keys to the new major-group keys.
export const RETARGET_MIGRATE = {
  side_delts: "shoulders",
  upper_chest: "chest",
  back_width: "back",
};

// ---- Retargeting Taxonomy (v2) ----
// Areas + optional sub-tags. Picks are stored as strings: "area" or "area/sub".
// Legacy flat area keys (no "/") map to their area with no sub-tag selected —
// nothing breaks, nothing is deleted.
export const RETARGET_TAXONOMY = [
  {
    key: "chest",
    label: "Chest",
    subs: [
      { key: "upper", label: "Upper", splitEx: ["Incline Press (or other alternative machines)"] },
      { key: "mid", label: "Mid", splitEx: ["Bench Press (or press movement)", "Chest Fly (pec deck machine, or other fly variations)"] },
      { key: "lower", label: "Lower", splitEx: ["Dips", "Kneeling High-to-Low Cable Flys"] },
    ],
  },
  {
    key: "back",
    label: "Back",
    subs: [
      { key: "width", label: "Width (lats)", splitEx: ["Lat Pulldown, Wide Grip", "Pull-Ups"] },
      { key: "thickness", label: "Thickness (mid-back)", splitEx: ["Lat Pulldown, Close Grip", "Single Arm Rows"] },
      { key: "traps", label: "Traps" },
    ],
  },
  {
    key: "shoulders",
    label: "Shoulders",
    subs: [
      { key: "side_delts", label: "Side Delts", splitEx: ["Lateral Raises (front × side raise superset)", "Cable Machine Lateral Raises"] },
      { key: "rear_delts", label: "Rear Delts", bank: "shoulders" },
      { key: "front_delts", label: "Front Delts", splitEx: ["Shoulder Press", "Overhead (Shoulder) Press"] },
    ],
  },
  {
    key: "arms",
    label: "Arms",
    subs: [
      { key: "biceps", label: "Biceps", splitEx: ["Bicep Standing Curls", 'Half-and-Half Curls (aka "21s")', "Preacher Curls"] },
      { key: "triceps", label: "Triceps", splitEx: ["Tricep Rope Extensions", "Tricep Straight Bar Pushdowns", "Tricep Kickbacks (single arm, cable attachment)", "Dips"] },
    ],
  },
  {
    key: "legs",
    label: "Legs",
    subs: [
      { key: "quads", label: "Quads", splitEx: ["Hack Squat (or regular squat; can sub bulgarian or split squat)", "Leg Press Machine", "Quad Curl Machine (can sub bulgarian or split squat)"] },
      { key: "glutes", label: "Glutes", splitEx: ["Bulgarian Split Squat"] },
      { key: "hamstrings", label: "Hamstrings", splitEx: ["Hamstring Curl Machine"] },
      { key: "calves", label: "Calves", bank: "calves" },
    ],
  },
  {
    key: "abs",
    label: "Abs",
    subs: [
      {
        key: "lower_abs",
        label: "Lower Abs",
        recommended: true,
        inline: [
          { name: "Leg Raises (timed)", prescription: "3 sets to failure (timed): 80% · 80% · 90-100%" },
        ],
      },
      {
        key: "mid_upper",
        label: "Mid-to-Upper",
        inline: [
          { name: "Crunches", prescription: "3 sets: 15-20 · 15-20 · 15-20" },
          { name: "Rowboats", prescription: "3 sets: 15-20 · 15-20 · 15-20" },
        ],
      },
      {
        key: "obliques",
        label: "Obliques",
        inline: [
          { name: "Russian Twists", prescription: "3 sets: 15-20 · 15-20 · 15-20" },
          { name: "Bicycles", prescription: "3 sets: 15-20 · 15-20 · 15-20" },
        ],
      },
    ],
  },
];


// Index every split exercise by name (prescription + optional note/alt) so the
// retargeting generator can pull split prescriptions by reference.
function buildSplitIndex() {
  const idx = new Map();
  for (const day of [...TRACK_A, ...TRACK_B]) {
    if (!day?.exercises) continue;
    for (const ex of day.exercises) {
      if (ex && ex.name && !idx.has(ex.name)) {
        const e = { name: ex.name, prescription: ex.prescription || "" };
        if (ex.note) e.note = ex.note;
        if (ex.alt) e.alt = ex.alt;
        idx.set(ex.name, e);
      }
    }
  }
  return idx;
}
const SPLIT_INDEX = buildSplitIndex();

// Normalize any stored pick (string "area" | "area/sub", or legacy object) into
// { area, sub }. Legacy flat keys migrate via RETARGET_MIGRATE.
export function normalizePick(p) {
  if (!p) return { area: null, sub: null };
  if (typeof p === "object") return { area: p.area || null, sub: p.sub || null };
  const s = String(p);
  if (s.includes("/")) {
    const [area, sub] = s.split("/");
    return { area, sub: sub || null };
  }
  return { area: RETARGET_MIGRATE[s] || s, sub: null };
}

export function encodePick(pick) {
  const { area, sub } = normalizePick(pick);
  if (!area) return null;
  return sub ? `${area}/${sub}` : area;
}

// Member-facing label for a pick: "Chest · Upper" or "Chest" (no sub).
export function pickLabel(pick) {
  const { area, sub } = normalizePick(pick);
  const a = RETARGET_TAXONOMY.find((t) => t.key === area);
  if (!a) return titleCaseArea(area);
  if (!sub) return a.label;
  const s = a.subs.find((x) => x.key === sub);
  return s ? `${a.label} · ${s.label}` : a.label;
}

// Read helpers for the v2 bank (object keyed by area, with area-level + sub-tag entries).
function bankAreaEntries(areaKey) {
  const b = RETARGET_BANK[areaKey];
  return b && Array.isArray(b.area) ? b.area.map((e) => ({ ...e })) : [];
}
function bankSubEntries(areaKey, subKey) {
  const b = RETARGET_BANK[areaKey];
  if (!b || !b.subs || !subKey) return [];
  const list = b.subs[subKey];
  return Array.isArray(list) ? list.map((e) => ({ ...e })) : [];
}
function bankAllSubEntries(areaKey) {
  const b = RETARGET_BANK[areaKey];
  if (!b || !b.subs) return [];
  return Object.values(b.subs).flat().map((e) => ({ ...e }));
}

// Resolve the exercise pool for one pick (area + optional sub-tag).
// Primary pool comes from the taxonomy sub (split references → split exercises,
// inline list → those entries, bank reference → that area's full pool), then
// the bank's sub-tag entries and area-level entries are merged in — area-level
// entries serve every sub-tag of their area. Result is deduped by name.
function resolveSubExercises(areaKey, subKey) {
  const area = RETARGET_TAXONOMY.find((a) => a.key === areaKey);
  if (!area) return [...bankAreaEntries(areaKey), ...bankAllSubEntries(areaKey)];
  if (!subKey) return [...bankAreaEntries(areaKey), ...bankAllSubEntries(areaKey)];
  const sub = area.subs.find((s) => s.key === subKey);
  if (!sub) return [...bankAreaEntries(areaKey), ...bankAllSubEntries(areaKey)];

  let primary = [];
  if (sub.inline) primary = sub.inline.map((e) => ({ ...e }));
  else if (sub.splitEx) {
    primary = sub.splitEx
      .map((name) => {
        const found = SPLIT_INDEX.get(name);
        return found ? { ...found } : null;
      })
      .filter(Boolean);
  } else if (sub.bank) {
    primary = [...bankAreaEntries(sub.bank), ...bankAllSubEntries(sub.bank)];
  }

  const merged = [...primary, ...bankSubEntries(areaKey, subKey), ...bankAreaEntries(areaKey)];
  const seen = new Set();
  return merged.filter((e) => {
    if (!e || !e.name || seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

// Supplement pool for a pick when its sub pool is exhausted (to reach the
// 6–8 / 3–4 targets): the area's broadest pool (area-level + every sub-tag),
// deduped against what's already in the session.
function supplementPool(areaKey) {
  return resolveSubExercises(areaKey, null);
}

// Build a retargeting session from the member's picks.
//   { half: false } → Day 5 full session, up to 8 exercises
//   { half: true }  → Day 6 (50/50) half session, up to 4 exercises
// The session's exercise slots are distributed across the chosen areas
// proportionally to each pick's "allocation" percentage (largest-remainder
// rounding, min 1 slot per area). Per-pick pools and the supplementPool
// fallback are unchanged — only the per-area slot counts change. Priority 1
// (the first pick) leads the session order, then the rest in allocation order.
// Picks without an allocation (older saves) fall back to order-based defaults
// (65/35 or 55/30/15). Generated exercises keep their split prescriptions; bank
// entries keep their own. Fixed once generated — regenerate only on change.
export function buildRetargetSession(picks, opts = {}) {
  const half = !!opts.half;
  if (!picks || !picks.length) return [];

  // Order-based defaults for picks that carry no allocation (older saves).
  function defaultAllocs(n) {
    if (n === 2) return [65, 35];
    if (n === 3) return [55, 30, 15];
    if (n === 1) return [100];
    return new Array(n).fill(Math.round(100 / n));
  }
  // Largest-remainder slot distribution: min 1 per area, sum === total.
  function distributeSlots(allocs, total) {
    const n = allocs.length;
    if (!n || total <= 0) return new Array(n || 0).fill(0);
    const base = new Array(n).fill(1);
    const leftover = Math.max(0, total - n);
    const sum = allocs.reduce((a, b) => a + b, 0) || n;
    const floats = allocs.map((a) => (a / sum) * leftover);
    const floored = floats.map((f) => Math.floor(f));
    let diff = leftover - floored.reduce((a, b) => a + b, 0);
    const order = floats
      .map((f, i) => ({ i, r: f - floored[i] }))
      .sort((a, b) => b.r - a.r);
    let k = 0;
    while (diff > 0 && k < order.length) {
      floored[order[k].i]++;
      diff--;
      k++;
    }
    return base.map((b, i) => b + floored[i]);
  }

  const norm = picks
    .map((raw) => {
      const nrm = normalizePick(raw);
      const allocation =
        raw && typeof raw === "object" && raw.allocation != null
          ? Number(raw.allocation)
          : null;
      return { ...nrm, allocation };
    })
    .filter((p) => p.area);
  if (!norm.length) return [];

  const max = half ? 4 : 8;

  const hasAll = norm.every(
    (p) => p.allocation != null && !Number.isNaN(p.allocation)
  );
  const allocs = hasAll ? norm.map((p) => p.allocation) : defaultAllocs(norm.length);
  const slots = distributeSlots(allocs, max);

  // Candidate list for a general pick (no sub-tag): the area's broadest pool
  // (supplementPool = area-level + every sub-tag bank entry, in current order),
  // then the splitEx lists of that area's subs interleaved round-robin in
  // taxonomy sub order (first splitEx of each sub, then the second, …),
  // converted via SPLIT_INDEX exactly like the sub-pick path. Deduped by name
  // (supplementPool entries lead, so they win). Sub picks keep their own
  // candidate list (resolveSubExercises); they widen to this general list only
  // when their own candidates run out during the fill phase.
  function generalCandidates(areaKey) {
    const base = supplementPool(areaKey);
    const seen = new Set(base.map((e) => e.name));
    const rr = [];
    const area = RETARGET_TAXONOMY.find((a) => a.key === areaKey);
    if (area) {
      // Round-robin the per-sub candidate lists (resolveSubExercises) in
      // taxonomy sub order — first entry of each sub, then the second of
      // each, … — so inline/bank subs (abs, calves, rear delts, traps)
      // contribute to general picks the same way splitEx subs already do.
      // Names already in the base or drawn earlier this round are skipped.
      const subLists = area.subs.map((s) => resolveSubExercises(areaKey, s.key));
      const maxLen = subLists.reduce((m, list) => Math.max(m, list.length), 0);
      for (let k = 0; k < maxLen; k++) {
        for (const list of subLists) {
          const ex = list[k];
          if (!ex || !ex.name || seen.has(ex.name)) continue;
          seen.add(ex.name);
          rr.push({ ...ex });
        }
      }
    }
    return [...base, ...rr];
  }

  // Per-pick candidate stream + a read pointer. Sub picks lead with their own
  // list, then widen to the general list; general picks use the general list.
  const streams = norm.map((p) =>
    p.sub
      ? [...resolveSubExercises(p.area, p.sub), ...generalCandidates(p.area)]
      : generalCandidates(p.area)
  );
  const ptrs = norm.map(() => 0);
  const names = new Set();
  const perArea = norm.map(() => []);

  // Per-area quota draw: take up to slots[i] unused candidates from the stream.
  for (let i = 0; i < norm.length; i++) {
    while (perArea[i].length < slots[i] && ptrs[i] < streams[i].length) {
      const ex = streams[i][ptrs[i]++];
      if (ex && ex.name && !names.has(ex.name)) {
        perArea[i].push(ex);
        names.add(ex.name);
      }
    }
  }

  // Priority 1 (first pick) leads; the rest follow in allocation order.
  const rest = norm
    .map((_, i) => i)
    .filter((i) => i !== 0)
    .sort((a, b) => allocs[b] - allocs[a] || a - b);
  const order = [0, ...rest];

  // Hold the session at full size: if the quota draws came up short, cycle
  // through the picked areas in session order, taking the next unused
  // candidate from each and appending it to the end of that area's block
  // (so each area stays grouped). Sub picks widen to their general list once
  // their own candidates are exhausted. Stop at the target or when no picked
  // area has any unused candidate. Never draw from an unpicked area, never
  // duplicate a name.
  const target = max;
  let total = perArea.reduce((s, a) => s + a.length, 0);
  let progressed = true;
  while (total < target && progressed) {
    progressed = false;
    for (const i of order) {
      if (total >= target) break;
      while (ptrs[i] < streams[i].length) {
        const ex = streams[i][ptrs[i]++];
        if (ex && ex.name && !names.has(ex.name)) {
          perArea[i].push(ex);
          names.add(ex.name);
          total++;
          progressed = true;
          break;
        }
      }
    }
  }

  const session = [];
  order.forEach((i) => {
    session.push(...perArea[i]);
  });

  return session.slice(0, max).map((ex, i) => ({
    n: i + 1,
    name: ex.name,
    prescription: ex.prescription || "",
    ...(ex.note ? { note: ex.note } : {}),
    ...(ex.alt ? { alt: ex.alt } : {}),
    ...(ex.recommended ? { recommended: ex.recommended } : {}),
  }));
}

// Display-only: turn a raw snake_case area key into Title Case for the member
// UI. Bank labels are already nice; this only formats keys that don't resolve
// (e.g. legacy "upper_chest" -> "Upper Chest"). Never changes stored data.
export function titleCaseArea(key) {
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Display-only set-count trim for "Short on time today". Maps the leading
// set count: 4 -> 3, 3 -> 2, 3-4 -> 2-3. When the prescription is a clean
// "N sets: a · b · c" (chunk count == original set count), trailing rep
// chunks are dropped to match the new count. Never edits chunk text, never
// removes exercises, never changes order — pure display, today only.
export function trimSetsDisplay(prescription) {
  if (!prescription) return prescription;
  const m = prescription.match(/^(\d+|\d+-\d+)\s+sets\b/);
  if (!m) return prescription;
  const token = m[1];
  let newToken;
  if (token === "4") newToken = "3";
  else if (token === "3") newToken = "2";
  else if (token === "3-4") newToken = "2-3";
  else return prescription;
  const rest = prescription.slice(m[0].length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return `${newToken} sets${rest}`;
  const labelTail = rest.slice(0, colonIdx);
  const body = rest.slice(colonIdx + 1).trim();
  const chunks = body.split(" · ");
  const origMax = token.includes("-") ? parseInt(token.split("-")[1], 10) : parseInt(token, 10);
  const newMax = newToken.includes("-") ? parseInt(newToken.split("-")[1], 10) : parseInt(newToken, 10);
  if (chunks.length === origMax && chunks.length > newMax) {
    return `${newToken} sets${labelTail}: ${chunks.slice(0, newMax).join(" · ")}`;
  }
  return `${newToken} sets${labelTail}: ${body}`;
}

// Travel / Home Protocol moved to src/lib/travelProtocol.js (Travel System v2).

// ---- Express Mode ----
// Each standard split day stores an `express` object: { exercises: [...], note? }.
// This builds the abbreviated session from that structured lineup — exercises
// renumbered from 1, each with its own name/prescription (+ optional note/alt).
// The parent day's banner carries through so Legs Express still shows its banner.
export function buildExpressSession(day) {
  if (!day || !day.express || !Array.isArray(day.express.exercises)) return null;
  const exercises = day.express.exercises
    .filter((e) => e && e.name)
    .map((e, i) => {
      const out = { n: i + 1, name: e.name, prescription: e.prescription || "" };
      if (e.note) out.note = e.note;
      if (e.alt) out.alt = e.alt;
      return out;
    });
  if (!exercises.length) return null;
  return {
    day: `${day.day}-express`,
    title: `${day.title} · Express`,
    type: "express",
    baseTitle: day.title,
    exercises,
    note: day.express.note || null,
    banner: day.banner || null,
  };
}

const SET_MINUTES = 1.5; // ~45s work + rest per set
function setsOf(ex) {
  const m = String(ex.prescription).match(/(\d+(?:\.\d+)?)\s*set/i);
  return m ? parseFloat(m[1]) : 3;
}

// Rough time estimate for the "time saved" line on the express toggle.
export function estimateExpressMinutes(day) {
  if (!day || !day.exercises) return { full: 0, express: 0, saved: 0 };
  const full = day.exercises.reduce((s, e) => s + setsOf(e) * SET_MINUTES, 0);
  const ex = buildExpressSession(day);
  const express = ex ? ex.exercises.reduce((s, e) => s + setsOf(e) * SET_MINUTES, 0) : 0;
  return {
    full: Math.round(full),
    express: Math.round(express),
    saved: Math.max(0, Math.round(full - express)),
  };
}

// travelSessionFor removed — replaced by buildTravelDay in src/lib/travelProtocol.js.

export { COACH_NOTE };