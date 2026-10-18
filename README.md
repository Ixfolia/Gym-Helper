# Peak System

A mobile fitness coach: fuel (calorie and protein) tracking with adaptive maintenance estimates, a fixed 3–5 or 4–6 day training split, habit tracking, monthly progress photos, and a four-phase "Aesthetic Ascent" journey.

This is a standalone rebuild of the original Base44 app. The screens and coaching logic are the same. The Base44 backend is gone: **all data is stored on your device**, with no account or server.

## Put it on your phone

The app is a Progressive Web App (PWA). Once it's hosted you open a URL and add it to your home screen. You don't need any command line.

1. **Turn on GitHub Pages (one time).** In the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Every push to `main` (or the `claude/peaceful-planck-n2pysf` branch) runs `.github/workflows/deploy-pages.yml`, which lints, builds and publishes the app. The URL is shown under **Settings → Pages** and on the workflow run, usually `https://<user>.github.io/Gym-Helper/`.
3. Open that URL on your phone:
   - **iPhone (Safari):** Share → **Add to Home Screen**.
   - **Android (Chrome):** ⋮ menu → **Install app** / **Add to Home screen**.

It then launches full screen like a native app and works offline. All artwork ships with the app in `public/art/`, and a service worker precaches it along with the app shell. Fonts are cached after the first online load.

## Where your data lives

- Every record (profile, daily fuel logs, weigh-ins, workouts, habits, journey progress, weekly grades) is kept in the browser's **IndexedDB** on the device. If IndexedDB isn't available, the app falls back to `localStorage`.
- Progress photos are shrunk to 1600 px JPEGs and stored as blobs in IndexedDB. They never leave the phone.
- On startup the app asks the browser for persistent storage, so the OS won't clear the data under storage pressure.
- **Settings → Your data** has **Export backup** (a JSON file that includes your photos; on phones it opens the share sheet), **Restore from backup**, and **Erase all data**. Make a backup before you switch phones or clear your browser data. Data is tied to the browser and URL you installed from.

## AI Coach

The app has a built-in coach (Home → chat icon, or **Talk to your coach**). It runs on your own AI account:

1. **Settings → AI Coach:** choose a provider, paste an API key, pick a model, then tap **Save & test connection**.
   - **Claude (Anthropic):** create a key at console.anthropic.com. Defaults to Claude Opus 5.5; Sonnet 5.5 and Haiku 5.5 are cheaper.
   - **OpenAI**, **OpenRouter** (one key for many models), or any **OpenAI-compatible** service: type the model id.
2. **Add instruction files** (`.md` / `.txt`). For AM Coach that's the master knowledge file followed by each update, in order; later files override earlier ones.
3. Chat. With every message the coach gets a read-only snapshot of your app data (targets, last 21 days of fuel logs, weigh-ins, training, habits, graded weeks, journey step). You can attach food photos for Plate Check.

How it works and what to expect:

- The app calls the provider directly from your phone. Your key, provider and model are stored on the device only and are **never included in backups**. The instruction files and chat history are stored on the device and are included in backups.
- The instruction files are not part of the app or this repository; they exist only on devices where you've loaded them.
- The instructions (~55k tokens for AM Coach) are sent with every message. With Claude they're prompt-cached, so after the first message in a session they cost about a tenth as much.
- No scheduled check-ins or texts: the coach only replies when you message it. The app tells the coach this, so it won't ask you to set up routines or WhatsApp.

## Developing

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint
npm run build     # static site in dist/ (relative paths, so it can be hosted anywhere)
npm run preview   # serve the production build
```

## Project layout

| Path | What it is |
| --- | --- |
| `src/api/db.js` | On-device data layer (IndexedDB) and the photo store. Replaces the Base44 SDK. |
| `src/lib/coach/` | AI coach: provider calls (`providers.js`) and the app-data snapshot (`context.js`) |
| `src/pages/` | Screens: Home, Fuel (+ Maintenance, GoalPacing), Train, Habits, Journey, Mirror, Gate, Settings |
| `src/components/` | Feature components grouped by screen, plus shadcn/ui primitives in `ui/` |
| `src/lib/` | Pure coaching logic: metabolism, winning week, journey engine, splits, gate, and more |
| `public/` | PWA manifest, service worker, icons, bundled artwork (`art/`) |
| `docs/ARCHITECTURE.md` | How the original app was reverse engineered, and how the logic works |
| `docs/entities/` | The original Base44 entity schemas (the data model) |
