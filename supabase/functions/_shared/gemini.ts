const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

type GeminiPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
  };
};

export class GeminiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
  }
}

export async function generateGeminiText(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  let lastError: GeminiRequestError | null = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await fetch(`${GEMINI_API_URL}/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json()) as GeminiResponse;
        const candidate = data.candidates?.[0];
        const raw = candidate?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim();

        if (!raw) {
          const reason = data.promptFeedback?.blockReason || candidate?.finishReason || "EMPTY_RESPONSE";
          throw new Error(`Gemini returned no usable content (${reason})`);
        }

        return raw;
      }

      const errorText = await response.text();
      console.error("Gemini error:", { model, attempt, status: response.status, errorText });

      lastError = new GeminiRequestError(
        response.status,
        `Gemini returned ${response.status}: ${errorText.slice(0, 300)}`
      );
      if (!RETRYABLE_STATUS_CODES.has(response.status)) {
        throw lastError;
      }

      if (attempt < 2) {
        await delay(600 * attempt);
      }
    }
  }

  throw lastError ?? new GeminiRequestError(500, "Gemini request failed");
}

export async function generateGeminiJson(body: Record<string, unknown>) {
  return parseJsonResponse(await generateGeminiText(body));
}

function parseJsonResponse(raw: string) {
  const cleaned = raw.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Gemini returned invalid JSON");
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
