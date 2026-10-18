// AI providers for the in-app coach. The member brings their own API key; the
// app talks to the provider straight from the browser, so nothing goes through
// a server of ours. SDKs are imported lazily to keep them out of the main bundle.

export const PROVIDERS = {
  anthropic: {
    label: "Claude (Anthropic)",
    keyHint: "sk-ant-…  from console.anthropic.com → API keys",
    models: [
      { id: "claude-opus-5-5", label: "Claude Opus 5.5 (recommended)" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (cheaper)" },
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (cheapest)" },
      { id: "claude-fable-5-1", label: "Claude Fable 5.1 (most capable, priciest)" },
    ],
    defaultModel: "claude-opus-5-5",
  },
  openai: {
    label: "OpenAI",
    keyHint: "sk-…  from platform.openai.com → API keys",
    baseURL: "https://api.openai.com/v1",
    models: [],
    modelHint: "e.g. an OpenAI chat model id",
  },
  openrouter: {
    label: "OpenRouter (many models)",
    keyHint: "sk-or-…  from openrouter.ai → Keys",
    baseURL: "https://openrouter.ai/api/v1",
    models: [],
    modelHint: "a model id from openrouter.ai/models",
  },
  custom: {
    label: "Other (OpenAI-compatible)",
    keyHint: "API key for that service",
    models: [],
    modelHint: "model id",
    needsBaseURL: true,
  },
};

// How the coach should treat the documents it was given. Those documents were
// written for a Base44 agent with routines, WhatsApp/iMessage and cross-app
// data access; inside this app none of that exists, so we say so up front.
export const OPERATOR_NOTE = `You are running inside the member's Peak System app on their phone, as its built-in coach. The documents that follow are your instructions and knowledge — follow them, with these adjustments for where you are running:

- The member's app data is attached to their newest message as an APP DATA SNAPSHOT. It is your read-only view of their app (it replaces "cross-app data access"). It is current as of that message; older messages in the conversation don't carry one. Never claim you wrote or changed anything in the app; the member enters all data themselves.
- There are no scheduled routines, no Daily Fire, no proactive texts, and no WhatsApp or iMessage connection here. You only speak when the member messages you. Ignore any instruction to activate, schedule or reschedule routines, to connect messaging channels, or to change agent settings, and never tell the member to do those things. If they want a weekly check-in, run it whenever they ask for one.
- There is no Base44 account, plan or agent-settings screen. Settings in the app live under Settings in the app itself.
- Persistent memory is limited to this conversation's history. If the member shares something important to remember (age under 18, injuries, history), restate it briefly in your reply so it stays in the history.
- When documents conflict, the later document wins, as the documents themselves state.`;

export function isConfigured(config, docs) {
  if (!config?.apiKey || !config?.provider || !config?.model) return false;
  if (PROVIDERS[config.provider]?.needsBaseURL && !config.baseURL) return false;
  return docs.length > 0;
}

function docsText(docs) {
  return docs.map((d, i) => `===== DOCUMENT ${i + 1}: ${d.name} =====\n\n${d.text}`).join("\n\n");
}

// The snapshot rides on the newest message rather than in the system prompt:
// it changes every turn (it carries the time), and keeping it out of the
// system prompt lets the large, unchanging instructions stay cached.
function withSnapshot(text, snapshot) {
  return `${snapshot}\n\n===== MEMBER'S MESSAGE =====\n${text || "(photo)"}`;
}

const dataUrlParts = (url) => {
  const m = /^data:([^;]+);base64,(.*)$/.exec(url || "");
  return m ? { mediaType: m[1], data: m[2] } : null;
};

// ---- Anthropic -------------------------------------------------------------

async function streamAnthropic({ config, docs, snapshot, messages, onText, signal }) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });

  const apiMessages = messages.map((m, idx) => {
    const content = [];
    for (const img of m.images || []) {
      const p = dataUrlParts(img);
      if (p) content.push({ type: "image", source: { type: "base64", media_type: p.mediaType, data: p.data } });
    }
    const isLast = idx === messages.length - 1;
    content.push({ type: "text", text: isLast ? withSnapshot(m.text, snapshot) : m.text || "(photo)" });
    return { role: m.role, content };
  });

  const stream = client.beta.messages.stream(
    {
      model: config.model,
      max_tokens: 16000,
      // Re-run on a fallback model if the chosen one declines; a no-op on models without fallbacks.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        // The instructions never change between messages, so they are cached:
        // after the first message they are billed at a fraction of the price.
        { type: "text", text: `${OPERATOR_NOTE}\n\n${docsText(docs)}`, cache_control: { type: "ephemeral" } },
      ],
      messages: apiMessages,
    },
    { signal }
  );
  stream.on("text", (delta) => onText(delta));
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") {
    return { refused: true, detail: final.stop_details?.explanation || null };
  }
  return { refused: false, truncated: final.stop_reason === "max_tokens" };
}

// ---- OpenAI-compatible (OpenAI, OpenRouter, others) ------------------------

async function streamOpenAICompatible({ config, docs, snapshot, messages, onText, signal }) {
  const { default: OpenAI } = await import("openai");
  const baseURL = config.provider === "custom" ? config.baseURL : PROVIDERS[config.provider].baseURL;
  const client = new OpenAI({ apiKey: config.apiKey, baseURL, dangerouslyAllowBrowser: true });

  const apiMessages = [
    { role: "system", content: `${OPERATOR_NOTE}\n\n${docsText(docs)}` },
    ...messages.map((m, idx) => {
      const text = idx === messages.length - 1 ? withSnapshot(m.text, snapshot) : m.text || "(photo)";
      if (!m.images?.length) return { role: m.role, content: text };
      return {
        role: m.role,
        content: [...m.images.map((url) => ({ type: "image_url", image_url: { url } })), { type: "text", text }],
      };
    }),
  ];

  const stream = await client.chat.completions.create({ model: config.model, messages: apiMessages, stream: true }, { signal });
  let finish = null;
  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    const delta = choice?.delta?.content;
    if (delta) onText(delta);
    if (choice?.finish_reason) finish = choice.finish_reason;
  }
  return { refused: finish === "content_filter", truncated: finish === "length" };
}

export function streamCoachReply(args) {
  return args.config.provider === "anthropic" ? streamAnthropic(args) : streamOpenAICompatible(args);
}

// Turn a provider error into one line the member can act on.
export function describeError(err) {
  const status = err?.status;
  if (err?.name === "AbortError" || err?.name === "APIUserAbortError") return null;
  if (status === 401 || status === 403) return "The API key was rejected. Check it in Settings → AI Coach.";
  if (status === 404) return "That model wasn't found for this provider. Pick another in Settings → AI Coach.";
  if (status === 429) return "Rate limited or out of credit with your provider. Wait a moment, or check your account's billing.";
  if (status === 529 || (status >= 500 && status < 600)) return "The provider is having trouble right now. Try again in a minute.";
  if (status === 400) return `The provider refused the request: ${err?.error?.error?.message || err?.message || "bad request"}`;
  if (!navigator.onLine) return "You're offline. The coach needs an internet connection.";
  return err?.message || "Something went wrong talking to the coach.";
}

// A tiny request that proves the key and model work, without sending the documents.
export async function testConnection(config) {
  let got = "";
  await streamCoachReply({
    config,
    docs: [],
    snapshot: "(connection test — no app data)",
    messages: [{ role: "user", text: "Reply with the single word: connected" }],
    onText: (d) => (got += d),
  });
  return got.trim();
}
