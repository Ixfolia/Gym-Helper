import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/api/db";

// One stored weight display preference (Profile.weight_unit, default "lbs").
// Flipping it switches every member-facing weight display app-wide. Storage
// stays kg; only display/entry convert at the boundary.
const WeightUnitContext = createContext({
  unit: "lbs",
  setUnit: async () => {},
  loading: true,
});

export function WeightUnitProvider({ children }) {
  const [unit, setUnitState] = useState("lbs");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.entities.Profile
      .list()
      .then((rows) => {
        const p = rows[0];
        if (p?.weight_unit === "kg" || p?.weight_unit === "lbs") setUnitState(p.weight_unit);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function setUnit(u) {
    if (u !== "lbs" && u !== "kg") return;
    setUnitState(u);
    try {
      const rows = await db.entities.Profile.list();
      if (rows[0]) await db.entities.Profile.update(rows[0].id, { weight_unit: u });
    } catch {
      /* best-effort persist */
    }
  }

  return (
    <WeightUnitContext.Provider value={{ unit, setUnit, loading }}>
      {children}
    </WeightUnitContext.Provider>
  );
}

export function useWeightUnit() {
  return useContext(WeightUnitContext);
}