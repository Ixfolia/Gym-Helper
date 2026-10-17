// Weight unit conversion. The app stores weigh-ins in kg (metabolism + winning
// week logic are kg-based and must stay untouched); the new logging + chart
// surfaces display in lbs, converting at the boundary.
export const LB_PER_KG = 2.2046226218;

export function kgToLbs(kg) {
  if (kg == null) return null;
  return +(kg * LB_PER_KG).toFixed(1);
}

export function lbsToKg(lbs) {
  if (lbs == null) return null;
  return +(lbs / LB_PER_KG).toFixed(2);
}

// Display preference. Storage stays kg; the member-facing unit is a stored
// preference (default lbs). These convert at the display/entry boundary so
// every surface flips together.
export function kgToUnit(kg, unit) {
  if (kg == null) return null;
  return unit === "kg" ? +Number(kg).toFixed(1) : kgToLbs(kg);
}

export function unitToKg(val, unit) {
  if (val == null || val === "") return null;
  const n = Number(val);
  if (!isFinite(n)) return null;
  return unit === "kg" ? +n.toFixed(2) : lbsToKg(n);
}

export function unitLabel(unit) {
  return unit === "kg" ? "kg" : "lbs";
}

// Height. The app stores height in cm (metabolism calculations are cm-based
// and stay untouched); member-facing entry + display use feet + inches,
// converting at the boundary.
export const CM_PER_IN = 2.54;

export function cmToFtIn(cm) {
  if (cm == null) return { ft: null, in: null };
  const totalIn = cm / CM_PER_IN;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - ft * 12);
  return { ft, in: inches };
}

export function ftInToCm(ft, inches) {
  const f = Number(ft) || 0;
  const i = Number(inches) || 0;
  if (!f && !i) return null;
  return +((f * 12 + i) * CM_PER_IN).toFixed(1);
}