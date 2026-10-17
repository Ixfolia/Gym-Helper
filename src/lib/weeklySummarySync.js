import { db } from "@/api/db";
import { weekStartOfDate } from "./winningWeek";

// Delete the WeeklySummary row(s) for the calendar week containing `dateStr`,
// so the next Winning Week load regrades that week from fresh data. Called after
// a past day's DailyLog is edited or voided/unvoided (FuelDaily past-date saves,
// ReviewDays). A no-op when no summary exists for that week.
export async function deleteWeekSummaryForDate(dateStr) {
  if (!dateStr) return;
  try {
    const weekStart = weekStartOfDate(dateStr);
    const rows = await db.entities.WeeklySummary.filter({ week_start: weekStart });
    for (const r of rows || []) {
      try {
        await db.entities.WeeklySummary.delete(r.id);
      } catch (e) {
        /* ignore single-row delete failures */
      }
    }
  } catch (e) {
    /* ignore — grading is non-fatal */
  }
}

// Transactional WeeklySummary create: re-fetch the week's rows immediately
// before creating and abort (return null) if a summary already exists, so a
// concurrent load can never create a duplicate week_start.
export async function createWeekSummaryIfAbsent(row) {
  const existing = await db.entities.WeeklySummary.filter({ week_start: row.week_start });
  if (existing && existing.length) return null;
  return await db.entities.WeeklySummary.create(row);
}