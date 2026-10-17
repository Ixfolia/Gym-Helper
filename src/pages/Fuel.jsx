import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/api/db";
import FuelOnboarding from "@/components/fuel/FuelOnboarding";
import FuelDaily from "@/components/fuel/FuelDaily";

export default function Fuel() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialDate = useMemo(() => {
    const p = params.get("date");
    if (!p) return new Date();
    const d = new Date(p + "T12:00:00");
    if (isNaN(d.getTime())) return new Date();
    const today = new Date();
    return d > today ? today : d;
  }, [params]);

  useEffect(() => {
    db.entities.Profile.list()
      .then((rows) => setProfile(rows[0] || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const onboarded = profile && profile.activity_level && profile.goal && profile.weigh_in_day;
  if (!onboarded) return <FuelOnboarding existing={profile} onSaved={(p) => { setProfile(p); navigate("/"); }} />;

  return <FuelDaily initialDate={initialDate} />;
}