import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, Camera, Square, X, RotateCcw, Settings } from "lucide-react";
import { db } from "@/api/db";
import { WizardNavContext } from "@/lib/wizardNavContext";
import { loadCoachData, buildCoachContext } from "@/lib/coach/context";
import { streamCoachReply, describeError, isConfigured, PROVIDERS } from "@/lib/coach/providers";

// Messages sent to the model per request. Older turns stay on the device but
// drop out of the request, which keeps long chats affordable.
const HISTORY_LIMIT = 40;

// Food photos for Plate Check: shrink before sending, models don't need full-res.
async function photoToDataUrl(file, maxDim = 1024) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Minimal formatting for coach replies: paragraphs, bullet lines and **bold**.
function Formatted({ text }) {
  const bold = (line, key) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={`${key}-${i}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={`${key}-${i}`}>{part}</React.Fragment>
      )
    );
  return text.split(/\n{2,}/).map((para, pi) => (
    <p key={pi} className="mb-2 last:mb-0">
      {para.split("\n").map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 && <br />}
          {/^\s*[-•*]\s+/.test(line) ? <>• {bold(line.replace(/^\s*[-•*]\s+/, ""), `${pi}-${li}`)}</> : bold(line, `${pi}-${li}`)}
        </React.Fragment>
      ))}
    </p>
  ));
}

export default function Coach() {
  const navigate = useNavigate();
  const { setHideNav } = useContext(WizardNavContext);
  const [config, setConfig] = useState(null);
  const [docs, setDocs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [images, setImages] = useState([]);
  const [streaming, setStreaming] = useState(null); // text of the reply being written
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setHideNav(true);
    return () => setHideNav(false);
  }, [setHideNav]);

  useEffect(() => {
    (async () => {
      const [rows, d, msgs] = await Promise.all([
        db.entities.CoachConfig.list(),
        db.entities.CoachDoc.list("created_date"),
        db.entities.CoachMessage.list("created_date"),
      ]);
      setConfig(rows[0] || null);
      setDocs(d);
      setMessages(msgs);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streaming]);

  async function addPhotos(e) {
    const files = [...(e.target.files || [])].slice(0, 4);
    e.target.value = "";
    const urls = [];
    for (const f of files) {
      try {
        urls.push(await photoToDataUrl(f));
      } catch {
        /* unreadable image — skip it */
      }
    }
    setImages((cur) => [...cur, ...urls].slice(0, 4));
  }

  async function send() {
    const text = draft.trim();
    if ((!text && !images.length) || streaming !== null) return;
    setError(null);
    const userMsg = await db.entities.CoachMessage.create({ role: "user", text, images });
    const history = [...messages, userMsg];
    setMessages(history);
    setDraft("");
    setImages([]);
    setStreaming("");

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = "";
    try {
      const snapshot = buildCoachContext(await loadCoachData());
      // Skip empty turns (a reply that failed before any text arrived).
      const sendable = history.filter((m) => m.text || m.images?.length).slice(-HISTORY_LIMIT);
      while (sendable.length && sendable[0].role !== "user") sendable.shift();
      const result = await streamCoachReply({
        config,
        docs,
        snapshot,
        messages: sendable,
        signal: controller.signal,
        onText: (delta) => {
          reply += delta;
          setStreaming(reply);
        },
      });
      if (result.refused && !reply) reply = "The model declined to answer that one. Try rephrasing, or pick another model in Settings.";
      if (result.truncated) reply += "\n\n(Reply cut off — it hit the length limit.)";
    } catch (e) {
      const msg = describeError(e);
      if (msg) setError(msg);
    } finally {
      abortRef.current = null;
      if (reply) {
        const saved = await db.entities.CoachMessage.create({ role: "assistant", text: reply });
        setMessages((cur) => [...cur, saved]);
      }
      setStreaming(null);
    }
  }

  async function newChat() {
    if (streaming !== null) return;
    await Promise.all(messages.map((m) => db.entities.CoachMessage.delete(m.id)));
    setMessages([]);
    setError(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const ready = isConfigured(config, docs);
  const modelLabel = config ? PROVIDERS[config.provider]?.models.find((m) => m.id === config.model)?.label || config.model : "";

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-foreground/50 hover:text-foreground/80">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-foreground/40">Coach</p>
          {ready && <p className="text-[10px] text-foreground/30">{modelLabel}</p>}
        </div>
        <div className="flex items-center gap-4">
          {messages.length > 0 && (
            <button onClick={newChat} aria-label="New conversation" className="text-foreground/45 hover:text-foreground/80">
              <RotateCcw className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          )}
          <Link to="/settings" aria-label="Coach settings" className="text-foreground/45 hover:text-foreground/80">
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5">
        {!ready ? (
          <div className="mt-10 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm font-light leading-relaxed text-foreground/60">
            <p className="font-display text-xl font-bold text-foreground">Set up your coach.</p>
            <p className="mt-3">
              The coach runs on your own AI account. In Settings → AI Coach, paste an API key, pick a model, and add the
              coach's instruction files.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-foreground/50">
              <li>{config?.apiKey ? "✓" : "○"} API key</li>
              <li>{docs.length ? "✓" : "○"} Instruction files</li>
            </ul>
            <Link
              to="/settings"
              className="mt-5 block rounded-2xl bg-accent py-3.5 text-center text-sm text-primary-foreground glow-sm"
            >
              Go to Settings
            </Link>
          </div>
        ) : (
          <div className="space-y-4 pb-4 pt-2">
            {messages.length === 0 && streaming === null && (
              <p className="mt-10 text-center text-sm font-light text-foreground/40">
                Ask anything — your targets, today's food, a check-in. The coach sees your app data.
              </p>
            )}
            {messages.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
            {streaming !== null && (
              <Bubble m={{ role: "assistant", text: streaming || "…" }} />
            )}
            {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-200/80">{error}</p>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {ready && (
        <div className="border-t border-white/[0.06] bg-background/80 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          {images.length > 0 && (
            <div className="mb-2 flex gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <button
                    onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))}
                    aria-label="Remove photo"
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 text-foreground/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Add photo"
              className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-foreground/55"
            >
              <Camera className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Message your coach"
              className="max-h-36 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent/40 focus:outline-none"
            />
            {streaming !== null ? (
              <button
                onClick={() => abortRef.current?.abort()}
                aria-label="Stop"
                className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 text-accent"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!draft.trim() && !images.length}
                aria-label="Send"
                className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Bubble({ m }) {
  const mine = m.role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
          mine ? "rounded-br-lg bg-accent/15 text-foreground" : "rounded-bl-lg border border-white/[0.06] bg-white/[0.03] text-foreground/85"
        }`}
      >
        {m.images?.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {m.images.map((src, i) => (
              <img key={i} src={src} alt="" className="h-24 w-24 rounded-xl object-cover" />
            ))}
          </div>
        )}
        {m.text ? mine ? <p className="whitespace-pre-wrap">{m.text}</p> : <Formatted text={m.text} /> : null}
      </div>
    </div>
  );
}
