import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import {
  buildDeepSeekMessages,
  constantTimeEqual,
  isExpectedModel,
  parseAgentRequest,
  type AgentRequest
} from "../_shared/museum-agent-policy.ts";

const MODEL = "deepseek-v4-flash";
const PROMPT_VERSION = 2;
const MAX_BODY_BYTES = 16_384;
const REQUEST_LIMIT = 8;
const REQUEST_WINDOW_SECONDS = 60;
const DEFAULT_DAILY_MODEL_LIMIT = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ALLOWED_ORIGINS = new Set([
  "https://code-2-art.github.io",
  "http://127.0.0.1:4321",
  "http://localhost:4321"
]);

type RateLimitResult = {
  allowed: boolean;
  retry_after_seconds: number;
};

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResponse(body: unknown, status: number, origin: string | null, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      ...extraHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function fallbackResponse(reason: string, origin: string | null, extra: Record<string, unknown> = {}) {
  return jsonResponse({ fallback: true, reason, ...extra }, 200, origin);
}

function parseKeyMap(raw: string | undefined) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    return Object.values(value).filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  } catch {
    return [];
  }
}

function validPublishableKey(candidate: string) {
  if (!candidate) return false;
  const keys = [
    ...parseKeyMap(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")),
    Deno.env.get("SUPABASE_ANON_KEY")
  ].filter((key): key is string => Boolean(key));
  return keys.some((key) => constantTimeEqual(candidate, key));
}

function getAdminKey() {
  const secretKeys = parseKeyMap(Deno.env.get("SUPABASE_SECRET_KEYS"));
  return secretKeys[0] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function requestIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const address = forwarded || request.headers.get("cf-connecting-ip") || "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 300) || "unknown";
  return `${address}\n${agent}`;
}

async function consumeRateLimit(
  admin: ReturnType<typeof createClient>,
  clientHash: string,
  limit: number,
  windowSeconds: number
) {
  const { data, error } = await admin.rpc("consume_agent_rate_limit", {
    p_client_hash: clientHash,
    p_limit: limit,
    p_window_seconds: windowSeconds
  });
  if (error) throw new Error("rate_limit_unavailable");
  return (Array.isArray(data) ? data[0] : data) as RateLimitResult | null;
}

function cachePayload(request: AgentRequest) {
  return JSON.stringify({ prompt: PROMPT_VERSION, model: MODEL, ...request });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "origin_not_allowed" }, 403, null);
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, origin, { Allow: "POST, OPTIONS" });
  }
  if (!validPublishableKey(request.headers.get("apikey") || "")) {
    return jsonResponse({ error: "unauthorized" }, 401, origin);
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (contentType !== "application/json" || declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "invalid_request" }, 400, origin);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "request_too_large" }, 413, origin);
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, origin);
  }
  const parsed = parseAgentRequest(input);
  if (!parsed.ok) return jsonResponse({ error: parsed.error }, 400, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const adminKey = getAdminKey();
  if (!supabaseUrl || !adminKey) {
    return fallbackResponse("agent_unavailable", origin);
  }

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const clientHash = await hmac(requestIdentity(request), adminKey);
    const requestLimit = await consumeRateLimit(admin, clientHash, REQUEST_LIMIT, REQUEST_WINDOW_SECONDS);
    if (!requestLimit?.allowed) {
      const retryAfter = Math.max(1, requestLimit?.retry_after_seconds || REQUEST_WINDOW_SECONDS);
      return fallbackResponse("rate_limited", origin, { retry_after_seconds: retryAfter });
    }

    const cacheKey = await sha256(cachePayload(parsed.value));
    const now = new Date();
    const { data: cached } = await admin
      .from("agent_response_cache")
      .select("answer, model, usage")
      .eq("cache_key", cacheKey)
      .gt("expires_at", now.toISOString())
      .maybeSingle();

    if (cached?.answer && cached.model === MODEL) {
      return jsonResponse({
        ...cached,
        requested_model: MODEL,
        model_verified: true,
        cached: true
      }, 200, origin);
    }

    const deepSeekKey = Deno.env.get("DEEPSEEK_API_KEY")?.trim();
    if (!deepSeekKey) {
      return fallbackResponse("agent_not_configured", origin);
    }

    const dailyLimit = Math.min(
      100_000,
      Math.max(1, Number.parseInt(Deno.env.get("AGENT_DAILY_MODEL_LIMIT") || "", 10) || DEFAULT_DAILY_MODEL_LIMIT)
    );
    const dailyHash = await hmac(`daily-model-budget:${now.toISOString().slice(0, 10)}`, adminKey);
    const budget = await consumeRateLimit(admin, dailyHash, dailyLimit, 86_400);
    if (!budget?.allowed) {
      return fallbackResponse("daily_budget_reached", origin);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    let upstream: Response;
    try {
      upstream = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${deepSeekKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          thinking: { type: "disabled" },
          messages: buildDeepSeekMessages(parsed.value),
          max_tokens: 500,
          temperature: 0.2,
          user_id: clientHash
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      console.error("museum-agent upstream request failed", { status: upstream.status });
      return fallbackResponse("model_unavailable", origin);
    }

    const completion = await upstream.json() as {
      model?: unknown;
      choices?: Array<{ message?: { content?: unknown } }>;
      usage?: Record<string, unknown>;
    };
    if (!isExpectedModel(completion.model, MODEL)) {
      const receivedModel = typeof completion.model === "string"
        ? completion.model.slice(0, 80)
        : "missing";
      console.error("museum-agent model receipt mismatch", {
        expected: MODEL,
        received: receivedModel
      });
      return fallbackResponse("model_mismatch", origin, {
        requested_model: MODEL,
        received_model: receivedModel
      });
    }

    const actualModel = completion.model;
    const answer = typeof completion.choices?.[0]?.message?.content === "string"
      ? completion.choices[0].message.content.trim()
      : "";
    if (!answer || answer.length > 6000) {
      return fallbackResponse("invalid_model_response", origin);
    }

    const usage = completion.usage && typeof completion.usage === "object"
      ? Object.fromEntries(
          ["prompt_tokens", "completion_tokens", "total_tokens"].flatMap((key) =>
            Number.isFinite(completion.usage?.[key]) ? [[key, completion.usage?.[key]]] : []
          )
        )
      : {};
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString();
    const { error: cacheError } = await admin.from("agent_response_cache").upsert({
      cache_key: cacheKey,
      answer,
      model: actualModel,
      usage,
      created_at: now.toISOString(),
      expires_at: expiresAt
    });
    if (cacheError) console.error("museum-agent cache write failed", { code: cacheError.code });

    return jsonResponse({
      answer,
      model: actualModel,
      requested_model: MODEL,
      model_verified: true,
      usage,
      cached: false
    }, 200, origin);
  } catch (error) {
    console.error("museum-agent request failed", {
      type: error instanceof Error ? error.name : "unknown"
    });
    return fallbackResponse("agent_unavailable", origin);
  }
});
