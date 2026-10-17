// Parse a workout prescription string into set pills + modifier chips.
// Returns { sets, modifiers, prose, raw }:
//   sets      — one rep-count label per set, e.g. ["18-20","10-12","5-8","18-20"]
//   modifiers — short suffix chips (per-set annotations + qualifier like "to failure")
//   prose     — trailing text after an em dash, rendered as a line (not a chip)
//   raw       — the original prescription, only when it doesn't fit the "N sets:"
//               pill pattern; the caller then renders it as a plain text line so no
//               information is ever lost.
export function parsePrescription(prescription) {
  if (!prescription) return { sets: [], modifiers: [], prose: null, raw: null };
  const s = String(prescription).trim();
  const m = s.match(/^(\d+(?:-\d+)?)\s+sets\b([^:]*):\s*(.+)$/);
  if (!m) return { sets: [], modifiers: [], prose: null, raw: prescription };

  const qualifierTail = m[2].trim();
  let body = m[3].trim();
  let prose = null;
  const dashIdx = body.indexOf("—");
  if (dashIdx !== -1) {
    prose = body.slice(dashIdx + 1).trim();
    body = body.slice(0, dashIdx).trim();
  }

  const chunks = body.split(" · ").map((c) => c.trim()).filter(Boolean);
  const sets = [];
  const modifiers = [];
  for (const chunk of chunks) {
    const rm = chunk.match(/^(\d+(?:-\d+)?%?)/);
    if (rm) {
      sets.push(rm[1]);
      const rest = chunk.slice(rm[1].length).trim();
      if (rest) {
        const pm = rest.match(/^\((.+?)\)$/);
        modifiers.push(pm ? pm[1] : rest);
      }
    } else {
      const pm = chunk.match(/^([A-Za-z]+)\s*\((.+?)\)$/);
      if (pm) {
        sets.push(pm[1]);
        modifiers.push(pm[2]);
      } else {
        sets.push(chunk);
      }
    }
  }

  if (qualifierTail) modifiers.push(qualifierTail);
  if (prose === "") prose = null;
  return { sets, modifiers, prose, raw: null };
}