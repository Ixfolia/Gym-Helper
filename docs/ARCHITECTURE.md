# Peak System: reverse-engineering notes

## What the original was

The source export (`peak-system-source.zip`) is a **Base44** app: a React 18 + Vite + Tailwind + shadcn/ui frontend (about 17k lines) running against Base44's hosted backend. The backend supplied four things:

| Base44 service | Used for |
| --- | --- |
| Auth (`base44.auth.*`) | Email/password and Google sign-in, OTP verification, password reset |
| Entities (`base44.entities.X`) | 11 per-user collections with row-level security |
| Private file storage (`integrations.Core.UploadPrivateFile`) | Progress photos |
| Server function `signPhotoUrls` | Turned private photo URIs into 1-hour signed URLs |

None of the coaching logic ran on the server. Every calculation (maintenance, targets, grading, journey completion) is client-side code in `src/lib/`. That is why the app can run entirely on the device.

## What changed in the rebuild

| Original | Rebuild |
| --- | --- |
| `@base44/sdk` client | `src/api/db.js`: an IndexedDB store with the same `list / filter / get / create / update / delete` call shape, so the screens are almost unchanged |
| Rows get `id`, `created_date`, `updated_date` from the server | Generated locally (dedupe logic relies on `updated_date`) |
| Private upload + `signPhotoUrls` | `db.photos.upload(file)` stores a compressed blob. `db.photos.urls(ids)` returns object URLs |
| Login / Register / OTP / Forgot / Reset / OAuth-consent pages, `AuthContext`, `ProtectedRoute` | Removed. A single local user, so the app opens straight to the dashboard |
| Settings → Log out | Settings → **Your data** (export / restore / erase) |
| `BrowserRouter`, Base44 Vite plugin | `HashRouter`, plain Vite with `base: './'`, so it runs on static hosting |
| Base44 hosting | GitHub Pages workflow, PWA manifest and service worker (offline) |
| Artwork on Base44's media CDN (`media.base44.com`) | Bundled in `public/art/` (resized, WebP) and referenced through `src/lib/art.js` |
| Unused deps (Stripe, three, leaflet, quill, jspdf, lodash, moment…) | Dropped |

Two crashes on a fresh install were fixed along the way:

- **Journey** called `defaultSchedule(undefined)` when no profile existed.
- **Gate** evaluated metabolism against a `null` profile. It now redirects to onboarding instead.

## Data model (`docs/entities/*.jsonc`)

| Entity | Key fields | Notes |
| --- | --- | --- |
| `Profile` | sex, age, height (cm), current_weight (kg), activity_level, cadence `3-5`/`4-6`, track `A`/`B`, goal, goal_amount, goal_timeframe, weigh_in_day, habits[3], week_schedule[7], custom_target, protein_override_g, travel_mode, travel_equipment, retarget_areas, weight_unit | One row per user |
| `DailyLog` | date, calories, protein, meals, voided | One per day (deduped by date) |
| `WeighIn` | date, weight (kg) | Always stored in kg and converted for display |
| `WorkoutLog` | date, session_name, status, mode, travel | Cardio and travel sessions |
| `SessionCompletion` | date, session_name, journey_phase, travel | "Complete session" on the Train screen |
| `HabitLog` | date, habit_name, done | |
| `MaintenanceHistory` | date, value, source `calculated`/`manual` | Each refinement of the maintenance estimate |
| `WeeklySummary` | week_start, stage, warmup, nutrition_won / workouts_won / habits_won, won, averages | "Grade once, keep forever" weekly scorecards |
| `JourneyProgress` | step, status, completed_date | One per journey step |
| `ProgressPhoto` | date, file_url, private | Mirror Check photos |

## Core logic (`src/lib/`)

### Metabolism (`metabolism.js`)
- **BMR:** Mifflin–St Jeor, `10·kg + 6.25·cm − 5·age + 5` for men, `−161` for women.
- **Activity multiplier:** lifestyle base (sedentary 1.2 · light 1.3 · moderate 1.4 · active 1.45 · very active 1.5) + 0.025 per training day (cadence 3-5 counts as 4 days, 4-6 as 5), capped at 1.75.
- **Calibration adjustment:** the onboarding questions shift the result. Struggling to lose weight gives −5%, struggling to gain gives +5%. Gaining weight in the past year gives −3%, losing gives +2%. The total is clamped to ±8% and labelled slower-burning, balanced or fast-burning.
- **Protein:** bodyweight in lb × 1.0 g, or × 0.7 when cutting above 200 lb, or × 1.2 for a fast-burning gainer. Rounded to the nearest 5 g, and the user can override it.
- **Refinement:** once there are enough logged days and weigh-ins, maintenance is recalculated as `avgCalories − weeklyChangeLb · 3500 / 7`. Confidence goes Estimated → Refined (1 refinement) → Dialed In (3+).
- **Goal pacing:** turns the target weight and timeframe into a daily deficit or surplus.

### Winning Week (`winningWeek.js`, `weekScore.js`)
- Weeks run Monday–Sunday. A partial first week is a warm-up and is not graded. The first two full weeks are the "show-up" stage. After that, the grading rules tighten with the journey phase.
- Each week is graded on workouts, nutrition and habits, and the grade is saved to `WeeklySummary` once. Editing a past day deletes that week's summary so it gets regraded (`weeklySummarySync.js`).

### Journey (`journey.js`, `journeyEngine.js`)
- 4 phases and 19 steps: Foundation → Walls → City → Zenith.
- Each step has a mode. `auto` completes from real data (for example, 7 days logged or a baseline photo exists). `manual` needs an "I've done this" confirmation. `flex` is auto when the data signal exists and manual otherwise. `gate` is the transformation gate.

### The Gate (`gate.js`)
Five objective floors must all be met to certify Phase 3 and unlock Phase 4:
1. 12+ weeks of tracking.
2. Maintenance confidence is Dialed In.
3. 6+ winning weeks banked.
4. 3+ Mirror Checks.
5. The weight trend has moved toward the goal.

### Training (`splits.js`, `travelProtocol.js`, `prescription.js`)
- Track A (3–5 days, 5 training days plus 2 rest) and Track B (4–6 days, 6 plus 1 rest). The exercise content is fixed. Users can reorder their week, and an Express (shortened) version of each day is available.
- **Retarget day:** the user picks lagging muscle areas from a bank and gets a generated session.
- **Travel mode:** alternating bodyweight Travel Workouts A and B, filtered by the equipment the user has.

### Guardrails
- **Bounce back** (`bounceBack.js`): a day more than 800 kcal over the ceiling trims the following days' targets so the weekly average still lands.
- **Easy on the throttle** (`throttleStreak.js`): a warning after 3+ days in a row more than 1000 kcal below maintenance.
- **Outliers** (`outliers.js`): flags implausible days (under 1000 kcal, or outside 60–160% of the trailing mean) so the user can void them.
- **Reset protocol** (`resetProtocol.js`): after a long gap with no logs, the app offers a calm restart without deleting anything.
- **Streak tiers** (`streakTiers.js`): fire (0) → flex (10) → trophy (50) → crown (100).

## AM Coach (the AI agent)

In the original setup AM Coach was a separate Base44 agent, not part of the app's code. Its instructions were the knowledge documents; Base44's cross-app data access let it read the member's records; Base44 ran its scheduled messages (Daily Fire, weekly check-in), WhatsApp/iMessage delivery and memory. The app only pointed members to it in on-screen text.

The rebuild has the coach built in (`src/pages/Coach.jsx`, `src/lib/coach/`):

| Base44 agent | In-app coach |
| --- | --- |
| Instructions attached to the agent | Instruction files loaded in Settings → AI Coach, stored on the device (`CoachDoc`) |
| Cross-app data access | `buildCoachContext()` builds a read-only text snapshot from IndexedDB and attaches it to the newest message |
| Base44-hosted model | The member's own API key: Anthropic (official SDK) or any OpenAI-compatible endpoint (OpenAI SDK), called from the browser |
| Routines, WhatsApp/iMessage | None. An operating note sent ahead of the documents tells the coach these don't exist here |
| Agent memory | The conversation history (`CoachMessage`), last 40 messages per request |

Request shape for Claude: one system block (operating note + documents) with `cache_control`, so it is identical every turn and stays cached; the snapshot goes on the newest user message because it changes every turn. Requests use `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`), so a policy decline is retried on a fallback model where the chosen model supports it. `CoachConfig` (provider, key, model) is excluded from backup export and import.

