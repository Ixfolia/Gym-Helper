// Outlier Days review — flags logged days that look like junk data so the
// member can self-audit. A logged day is an OUTLIER when:
//   • the member has 7+ non-voided logged days total AND the day's calories
//     fall below 60% or above 160% of the trailing mean of the last 30
//     non-voided logged days (the days immediately preceding it, by date);
//   • OR the day's calories are under 1,000, regardless of the mean.
// Voided days are excluded from the trailing mean and from detection itself,
// but they stay visible in the Review Days list (with an Unvoid action).

export function isVoided(l) {
  return !!(l && l.voided);
}

export function detectOutliers(logs) {
  const all = (logs || []).filter(
    (l) => l && l.date && typeof l.calories === "number" && l.calories > 0
  );
  const nonVoided = all
    .filter((l) => !l.voided)
    .sort((a, b) => a.date.localeCompare(b.date));
  const voided = all.filter((l) => l.voided);
  const totalNonVoided = nonVoided.length;

  const outliers = [];
  for (let i = 0; i < nonVoided.length; i++) {
    const l = nonVoided[i];
    const underFloor = l.calories < 1000;
    let mean = null;
    let pctOfMean = null;
    let bandOutlier = false;
    if (totalNonVoided >= 7) {
      const trailing = nonVoided.slice(Math.max(0, i - 30), i);
      if (trailing.length) {
        mean = trailing.reduce((s, x) => s + x.calories, 0) / trailing.length;
        if (mean > 0) {
          pctOfMean = Math.round((l.calories / mean) * 100);
          if (l.calories < mean * 0.6 || l.calories > mean * 1.6) bandOutlier = true;
        }
      }
    }
    if (underFloor || bandOutlier) {
      outliers.push({ log: l, mean, pctOfMean, underFloor, bandOutlier });
    }
  }

  return {
    outliers,
    voided,
    hasAny: outliers.length > 0 || voided.length > 0,
  };
}