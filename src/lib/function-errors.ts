export async function getFunctionErrorMessage(
  error: unknown,
  response: Response | undefined,
  fallback: string
) {
  if (response) {
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = await response.clone().json();
        if (typeof payload?.error === "string" && payload.error.trim()) {
          return humanizeFunctionError(payload.error);
        }
        if (typeof payload?.message === "string" && payload.message.trim()) {
          return humanizeFunctionError(payload.message);
        }
      } else {
        const text = await response.clone().text();
        if (text.trim()) return humanizeFunctionError(text);
      }
    } catch {
      // Fall back to the Supabase error below when the response body can't be parsed.
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return humanizeFunctionError(error.message);
  }

  return fallback;
}

function humanizeFunctionError(message: string) {
  if (/quota|billing details|rate limit/i.test(message)) {
    return "Gemini API quota is exhausted. Update the GEMINI_API_KEY or enable billing in Google AI Studio.";
  }

  if (/high demand|temporar|unavailable|503/i.test(message)) {
    return "Gemini is temporarily overloaded. Please try again in a minute.";
  }

  if (/unable to process input image|invalid_argument/i.test(message)) {
    return "The photo could not be processed. Try a clearer, brighter fridge photo.";
  }

  return message;
}
