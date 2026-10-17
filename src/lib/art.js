// Bundled artwork. The PNGs live in public/art/ and ship with the build, so
// the app needs no external image host and works fully offline.
const art = (file) => `${import.meta.env.BASE_URL}art/${file}`;

export const ART = {
  ascentMountains: art("001B-ascent-mountain-range.png"),
  phaseBanners: {
    1: art("003-phase1-foundation-banner.png"),
    2: art("006A-phase2-walls-banner.png"),
    3: art("006B-phase3-city-banner.png"),
    4: art("006C-phase4-zenith-banner.png"),
  },
  streakBadges: {
    fire: art("012A-badge-fire.png"),
    flex: art("012B-badge-flex.png"),
    diamond: art("012C-badge-diamond.png"),
    trophy: art("012D-badge-trophy.png"),
    crown: art("012E-badge-crown.png"),
  },
  habitIcons: [
    art("016A-habit-slot1-crown-blue.png"),
    art("016B-habit-slot2-sunrise-flex.png"),
    art("016C-habit-slot3-book.png"),
    art("016D-habit-slot4-bolt.png"),
  ],
  pixelGlyphs: {
    camera: art("017-icon-camera.png"),
    airplane: art("020-icon-airplane.png"),
    stopwatch: art("020-icon-stopwatch.png"),
  },
};
