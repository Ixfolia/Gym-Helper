import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, FileText, Trash2, Upload, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { db } from "@/api/db";
import { PROVIDERS, testConnection, describeError } from "@/lib/coach/providers";

// Settings → AI Coach. Bring-your-own-key: the key, provider and model stay on
// this device (never in backups), and the coach's instruction documents are
// loaded from files rather than shipped with the app.
export default function CoachCard() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ provider: "anthropic", apiKey: "", model: PROVIDERS.anthropic.defaultModel, baseURL: "" });
  const [docs, setDocs] = useState([]);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [rows, d] = await Promise.all([db.entities.CoachConfig.list(), db.entities.CoachDoc.list("created_date")]);
      if (rows[0]) {
        setConfig(rows[0]);
        setForm({ provider: rows[0].provider, apiKey: rows[0].apiKey || "", model: rows[0].model || "", baseURL: rows[0].baseURL || "" });
      }
      setDocs(d);
    })();
  }, []);

  const provider = PROVIDERS[form.provider];
  const set = (k, v) => {
    setStatus(null);
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "provider") next.model = PROVIDERS[v].defaultModel || "";
      return next;
    });
  };

  async function save() {
    setBusy("save");
    const payload = { provider: form.provider, apiKey: form.apiKey.trim(), model: form.model.trim(), baseURL: form.baseURL.trim() };
    const row = config ? await db.entities.CoachConfig.update(config.id, payload) : await db.entities.CoachConfig.create(payload);
    setConfig(row);
    setBusy(null);
    return row;
  }

  async function test() {
    const row = await save();
    setBusy("test");
    setStatus(null);
    try {
      const reply = await testConnection(row);
      setStatus({ ok: true, text: `Connected to ${row.model}${reply ? ` — it replied "${reply.slice(0, 40)}"` : ""}.` });
    } catch (e) {
      setStatus({ ok: false, text: describeError(e) || "Cancelled." });
    } finally {
      setBusy(null);
    }
  }

  async function onFiles(e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    for (const f of files) {
      const text = await f.text();
      await db.entities.CoachDoc.create({ name: f.name, text });
    }
    setDocs(await db.entities.CoachDoc.list("created_date"));
  }

  async function removeDoc(id) {
    await db.entities.CoachDoc.delete(id);
    setDocs(await db.entities.CoachDoc.list("created_date"));
  }

  const input =
    "w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent/40 focus:outline-none";
  const label = "mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-foreground/45";
  const totalTokens = Math.round(docs.reduce((n, d) => n + (d.text?.length || 0), 0) / 4);

  return (
    <div className="mb-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/[0.06]">
          <Bot className="h-4 w-4 text-accent" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-sm text-foreground">AI Coach</p>
          <p className="text-[11px] font-light text-foreground/45">Your own API key · stays on this device</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <span className={label}>Provider</span>
          <select value={form.provider} onChange={(e) => set("provider", e.target.value)} className={input}>
            {Object.entries(PROVIDERS).map(([id, p]) => (
              <option key={id} value={id} className="bg-background">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {provider.needsBaseURL && (
          <div>
            <span className={label}>Base URL</span>
            <input value={form.baseURL} onChange={(e) => set("baseURL", e.target.value)} placeholder="https://…/v1" className={input} />
          </div>
        )}

        <div>
          <span className={label}>API key</span>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              autoComplete="off"
              value={form.apiKey}
              onChange={(e) => set("apiKey", e.target.value)}
              placeholder={provider.keyHint}
              className={`${input} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              aria-label={showKey ? "Hide key" : "Show key"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <span className={label}>Model</span>
          {provider.models.length ? (
            <select value={form.model} onChange={(e) => set("model", e.target.value)} className={input}>
              {provider.models.map((m) => (
                <option key={m.id} value={m.id} className="bg-background">
                  {m.label}
                </option>
              ))}
            </select>
          ) : (
            <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder={provider.modelHint} className={input} />
          )}
        </div>

        <button
          onClick={test}
          disabled={!!busy || !form.apiKey.trim() || !form.model.trim()}
          className="w-full rounded-2xl border border-accent/40 py-3 text-sm text-accent transition-all hover:bg-accent/[0.06] disabled:opacity-40"
        >
          {busy === "test" ? "Testing…" : busy === "save" ? "Saving…" : "Save & test connection"}
        </button>
        {status && (
          <p className={`text-[11px] font-light ${status.ok ? "text-emerald-300/80" : "text-red-300/80"}`}>
            {status.ok && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
            {status.text}
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <p className="text-sm text-foreground">Coach instructions</p>
        <p className="mt-1 text-[11px] font-light leading-relaxed text-foreground/45">
          The documents that make the coach who it is (for AM Coach: the master knowledge file, then each update). They're
          sent with every conversation and kept only on this device. Later documents override earlier ones.
        </p>
        <div className="mt-3 space-y-2">
          {docs.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-foreground/40" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-foreground/80">
                  {i + 1}. {d.name}
                </p>
                <p className="text-[10px] text-foreground/35">~{Math.round((d.text?.length || 0) / 4).toLocaleString()} tokens</p>
              </div>
              <button onClick={() => removeDoc(d.id)} aria-label={`Remove ${d.name}`} className="text-foreground/35 hover:text-red-300">
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-foreground/70 transition-colors hover:border-accent/30"
        >
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          <span>Add instruction files (.md / .txt)</span>
        </button>
        <input ref={fileRef} type="file" multiple accept=".md,.txt,.markdown,text/markdown,text/plain" className="hidden" onChange={onFiles} />
        {docs.length > 0 && (
          <p className="mt-2 text-[10px] text-foreground/35">Total ~{totalTokens.toLocaleString()} tokens per conversation (cached after the first message).</p>
        )}
      </div>

      <Link
        to="/coach"
        className="mt-5 block w-full rounded-2xl bg-accent py-3.5 text-center text-sm text-primary-foreground glow-sm transition-all hover:glow-md"
      >
        Open coach
      </Link>
    </div>
  );
}
