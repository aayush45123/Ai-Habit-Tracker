import OpenAI from "openai";

const DEFAULT_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "groq/compound-mini",
  "qwen/qwen3.6-27b",
].filter(Boolean);

export function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

/**
 * Executes a chat completion against Groq with automatic model fallbacks.
 */
export async function completeWithGroq({
  messages,
  temperature = 0.2,
  max_tokens = 1500,
  jsonMode = false,
  preferredModel = null,
}) {
  const groq = createGroqClient();
  if (!groq) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const modelQueue = Array.from(
    new Set([preferredModel, ...DEFAULT_MODELS].filter(Boolean))
  );

  let lastError = null;

  for (const model of modelQueue) {
    try {
      const payload = {
        model,
        messages,
        temperature,
        max_tokens,
      };

      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const completion = await groq.chat.completions.create(payload);
      const content = completion.choices?.[0]?.message?.content?.trim() || "";

      return {
        model,
        content,
        completion,
      };
    } catch (err) {
      console.warn(`[Groq AI] Model '${model}' failed:`, err.message || err);
      lastError = err;
      // Continue to next model in queue
    }
  }

  throw lastError || new Error("All Groq AI models failed to respond.");
}

/**
 * Parses JSON safely from an LLM response string.
 */
export function extractAndParseJSON(rawContent, fallback = null) {
  if (!rawContent || typeof rawContent !== "string") {
    return fallback;
  }

  // Strip markdown code blocks
  let clean = rawContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // If there are surrounding brackets or reasoning text, find JSON boundaries
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("[JSON Parse] Failed to parse JSON from AI output:", err.message, "\nRaw:", rawContent);
    return fallback;
  }
}
