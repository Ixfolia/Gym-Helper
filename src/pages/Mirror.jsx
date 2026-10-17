import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { db } from "@/api/db";
import ScreenShell from "@/components/ScreenShell";
import MirrorInvite from "@/components/mirror/MirrorInvite";
import MirrorTimeline from "@/components/mirror/MirrorTimeline";
import MirrorCompare from "@/components/mirror/MirrorCompare";
import MonthlyRevamp from "@/components/mirror/MonthlyRevamp";
import RetargetPicker from "@/components/train/RetargetPicker";

export default function Mirror() {
  const [photos, setPhotos] = useState([]);
  const [weighIns, setWeighIns] = useState([]);
  const [profile, setProfile] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [aId, setAId] = useState(null);
  const [bId, setBId] = useState(null);
  const [revampOpen, setRevampOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    const [p, w, profiles] = await Promise.all([
      db.entities.ProgressPhoto.list("-date", 100),
      db.entities.WeighIn.list("-date", 100),
      db.entities.Profile.list(),
    ]);
    setPhotos(p);
    setWeighIns(w);
    setProfile(profiles[0] || null);
    try {
      const urls = await db.photos.urls(p.map((ph) => ph.id));
      setSignedUrls(urls);
    } catch {
      setSignedUrls({});
    }
    setLoading(false);
    return p;
  }

  useEffect(() => {
    (async () => {
      const p = await load();
      if (p.length >= 1) setBId(p[0].id);
      if (p.length >= 2) setAId(p[p.length - 1].id);
    })();
  }, []);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await db.photos.upload(file);
      await db.entities.ProgressPhoto.create({
        date: format(new Date(), "yyyy-MM-dd"),
        file_url: file_uri,
        private: true,
      });
      const p = await load();
      setBId(p[0].id);
      if (p.length >= 2) setAId(p[p.length - 1].id);
      setRevampOpen(true);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const thisKey = format(new Date(), "yyyy-MM");
  const weighInThisMonth = weighIns.some((w) => w.date && w.date.startsWith(thisKey));
  const photoThisMonth = photos.some((p) => p.date && p.date.startsWith(thisKey));
  const inviteState = photoThisMonth ? "done" : weighInThisMonth ? "invite" : "waiting";

  return (
    <ScreenShell eyebrow="Journey" title="Mirror Check.">
      <p className="text-sm font-light leading-relaxed text-foreground/55">
        The mirror tells the truth across months, not weeks.
      </p>

      <div className="mt-6">
        <MirrorInvite
          state={inviteState}
          onCapture={() => fileRef.current?.click()}
          uploading={uploading}
        />
      </div>

      {photos.length > 0 && (
        <>
          <div className="mt-8">
            <MirrorTimeline
              photos={photos}
              signedUrls={signedUrls}
              selectedId={bId}
              onSelect={setBId}
            />
          </div>

          {photos.length >= 2 ? (
            <div className="mt-8">
              <MirrorCompare
                photos={photos}
                signedUrls={signedUrls}
                aId={aId}
                bId={bId}
                setA={setAId}
                setB={setBId}
              />
            </div>
          ) : (
            <p className="mt-6 text-center text-xs font-light text-foreground/40">
              Add a second month to compare side by side.
            </p>
          )}
        </>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs text-foreground/40 transition-colors hover:text-accent"
        >
          Add a Mirror Check photo
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <MonthlyRevamp
        open={revampOpen}
        profile={profile}
        onClose={() => setRevampOpen(false)}
        onAdjust={() => {
          setRevampOpen(false);
          setAdjustOpen(true);
        }}
        onSaved={(updated) => setProfile(updated)}
      />

      <RetargetPicker
        open={adjustOpen}
        profile={profile}
        onClose={() => setAdjustOpen(false)}
        onSaved={(updated) => setProfile(updated)}
      />
    </ScreenShell>
  );
}