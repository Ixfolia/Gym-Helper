// "Easy on the throttle" notice — fires once per occurrence when logged intake
// runs more than 1000 kcal below maintenance for 3+ consecutive calendar days.
// The occurrence is keyed by the streak's start date, so dismissal holds for
// the life of one overcutting episode and re-arms only when a new streak begins.
import { differenceInCalendarDays, parseISO } from "date-fns";

export const THROTTLE_DISMISS_KEY = "peak_throttle_dismissed";

function dayDiff(aStr, bStr) {
  const a = parseISO(aStr + "T12:00:00");
  const b = parseISO(bStr + "T12:00:00");
  return differenceInCalendarDays(b, a);
}

export function findThrottleOccurrence({ maintenance, dailyLogs }) {
  if (!maintenance) return null;
  const logged = (dailyLogs || [])
    .filter(
      (l) =>
        l &&
        l.date &&
        typeof l.calories === "number" &&
        l.calories > 0 &&
        !l.voided
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!logged.length) return null;

  let run = [];
  let lastRun = null;
  for (const l of logged) {
    const deficit = maintenance - l.calories;
    if (deficit > 1000) {
      if (run.length === 0) {
        run = [l.date];
      } else {
        const prev = run[run.length - 1];
        if (dayDiff(prev, l.date) === 1) run.push(l.date);
        else {
          lastRun = run;
          run = [l.date];
        }
      }
    } else {
      if (run.length) lastRun = run;
      run = [];
    }
  }
  if (run.length) lastRun = run;
  if (!lastRun || lastRun.length < 3) return null;
  return {
    startDate: lastRun[0],
    endDate: lastRun[lastRun.length - 1],
    days: lastRun.length,
  };
}

export function dismissedThrottle() {
  try {
    return localStorage.getItem(THROTTLE_DISMISS_KEY) || "";
  } catch {
    return "";
  }
}

export function dismissThrottle(startDate) {
  try {
    localStorage.setItem(THROTTLE_DISMISS_KEY, startDate);
  } catch {
    /* storage unavailable — in-memory hide still works for the session */
  }
}