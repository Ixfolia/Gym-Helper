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

It then launches full screen like a native app and works offline. A service worker caches the app shell, the artwork and the fonts.

## Where your data lives

- Every record (profile, daily fuel logs, weigh-ins, workouts, habits, journey progress, weekly grades) is kept in the browser's **IndexedDB** on the device. If IndexedDB isn't available, the app falls back to `localStorage`.
- Progress photos are shrunk to 1600 px JPEGs and stored as blobs in IndexedDB. They never leave the phone.
- On startup the app asks the browser for persistent storage, so the OS won't clear the data under storage pressure.
- **Settings → Your data** has **Export backup** (a JSON file that includes your photos; on phones it opens the share sheet), **Restore from backup**, and **Erase all data**. Make a backup before you switch phones or clear your browser data. Data is tied to the browser and URL you installed from.

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
| `src/pages/` | Screens: Home, Fuel (+ Maintenance, GoalPacing), Train, Habits, Journey, Mirror, Gate, Settings |
| `src/components/` | Feature components grouped by screen, plus shadcn/ui primitives in `ui/` |
| `src/lib/` | Pure coaching logic: metabolism, winning week, journey engine, splits, gate, and more |
| `public/` | PWA manifest, service worker, icons |
| `docs/ARCHITECTURE.md` | How the original app was reverse engineered, and how the logic works |
| `docs/entities/` | The original Base44 entity schemas (the data model) |
