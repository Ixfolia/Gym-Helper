import React, { useRef, useState } from "react";
import { format } from "date-fns";
import { Download, Upload, Trash2, HardDrive } from "lucide-react";
import { db } from "@/api/db";

// Everything is stored on this device only. This card is the safety net:
// export a backup file, restore it on another phone, or wipe the device.
export default function DataCard() {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmErase, setConfirmErase] = useState(false);

  async function exportBackup() {
    setBusy("export");
    setMessage("");
    try {
      const backup = await db.exportAll();
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      const name = `peak-system-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
      const file = new File([blob], name, { type: "application/json" });
      // Mobile: hand the file to the share sheet (Files, Drive, email…).
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Peak System backup" });
          setMessage("Backup ready.");
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Backup downloaded.");
    } catch (e) {
      setMessage(e?.message || "Export failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("import");
    setMessage("");
    try {
      await db.importAll(JSON.parse(await file.text()));
      window.location.reload();
    } catch (err) {
      setMessage(err?.message || "Import failed.");
      setBusy(null);
    }
  }

  async function erase() {
    setBusy("erase");
    try {
      await db.clearAll();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      setMessage(e?.message || "Erase failed.");
      setBusy(null);
    }
  }

  const row =
    "flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-foreground/70 transition-colors hover:border-accent/30 disabled:opacity-40";

  return (
    <div className="mt-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/[0.06]">
          <HardDrive className="h-4 w-4 text-accent" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-sm text-foreground">Your data</p>
          <p className="text-[11px] font-light text-foreground/45">Saved on this device only.</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-light leading-relaxed text-foreground/55">
        Logs, weigh-ins and progress photos never leave your phone. Export a backup now and then — it
        is the only way to move to a new device.
      </p>
      <div className="mt-5 space-y-2">
        <button onClick={exportBackup} disabled={!!busy} className={row}>
          <Download className="h-4 w-4" strokeWidth={1.5} />
          <span>{busy === "export" ? "Preparing…" : "Export backup"}</span>
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={!!busy} className={row}>
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          <span>{busy === "import" ? "Restoring…" : "Restore from backup"}</span>
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        {confirmErase ? (
          <div className="flex gap-2">
            <button
              onClick={erase}
              disabled={!!busy}
              className="flex-1 rounded-2xl border border-red-400/40 px-4 py-3 text-sm text-red-300 transition-colors hover:bg-red-400/[0.06] disabled:opacity-40"
            >
              {busy === "erase" ? "Erasing…" : "Erase everything"}
            </button>
            <button
              onClick={() => setConfirmErase(false)}
              disabled={!!busy}
              className="rounded-2xl border border-white/[0.06] px-4 py-3 text-sm text-foreground/60"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmErase(true)} disabled={!!busy} className={row}>
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            <span>Erase all data on this device</span>
          </button>
        )}
      </div>
      {message && <p className="mt-3 text-[11px] font-light text-foreground/50">{message}</p>}
    </div>
  );
}
