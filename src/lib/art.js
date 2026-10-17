// Bundled artwork. The PNGs live in public/art/ and ship with the build, so
// the app needs no external image host and works fully offline.
const art = (file) => `${import.meta.env.BASE_URL}art/${file}`;

export const ART = {
  ascentMountains: art("001B-ascent-mountain-range.webp"),
  phaseBanners: {
    1: art("003-phase1-foundation-banner.webp"),
    2: art("006A-phase2-walls-banner.webp"),
    3: art("006B-phase3-city-banner.webp"),
    4: art("006C-phase4-zenith-banner.webp"),
  },
  streakBadges: {
    fire: art("012A-badge-fire.webp"),
    flex: art("012B-badge-flex.webp"),
    diamond: art("012C-badge-diamond.webp"),
    trophy: art("012D-badge-trophy.webp"),
    crown: art("012E-badge-crown.webp"),
  },
  habitIcons: [
    art("016A-habit-slot1-crown-blue.webp"),
    art("016B-habit-slot2-sunrise-flex.webp"),
    art("016C-habit-slot3-book.webp"),
    art("016D-habit-slot4-bolt.webp"),
  ],
  pixelGlyphs: {
    camera: art("017-icon-camera.webp"),
    airplane: art("020-icon-airplane.webp"),
    stopwatch: art("020-icon-stopwatch.webp"),
  },
};
