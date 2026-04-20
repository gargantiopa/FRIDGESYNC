// Edge function: detect ingredients from a fridge photo using Google Gemini AI
// Environment variables required:
//   GEMINI_API_KEY  - Google AI Studio API key
import { GeminiRequestError, generateGeminiText } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Missing image (base64 data URL)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip data URL prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const raw = await generateGeminiText({
      contents: [
        {
          parts: [
            {
              text: [
                "You are an expert food vision system for a smart-fridge app. Carefully analyze the photo and identify every distinct edible food item or ingredient you can see, including items that are partially visible, behind glass, in containers, jars, bottles, bags, or wrapped in packaging.",
                "",
                "Rules:",
                "- Inspect the image methodically from top shelf to bottom shelf, then drawers, then every door compartment.",
                "- Read labels on packaging when visible (for example Greek Yogurt, Oat Milk, Cheddar Cheese, Butter, Strawberry Jam).",
                "- Return as many valid food items as you can confidently identify; do not stop early after the first few items.",
                "- Use short, generic, human-friendly names in Title Case.",
                "- Include quantity or volume when reasonably visible.",
                "- Countable items should look like 'Eggs x6' or 'Tomatoes x3'.",
                "- Liquids or containers should look like 'Milk 1L' or 'Orange Juice 500ml'.",
                "- Partially used items should look like 'Milk 50%' or 'Butter (half)'.",
                "- Distinguish similar items when possible.",
                "- Include condiments and sauces if clearly visible.",
                "- Deduplicate repeated sightings of the same item and combine them into one entry with quantity.",
                "- Skip non-food objects, brand-only names without a recognizable food, and uncertain guesses.",
                "- If the photo is clearly not a fridge or contains no visible food, return an empty list.",
                "",
                "Return only this format, with no extra commentary:",
                "INGREDIENTS_START",
                "Eggs x6",
                "Cheddar Cheese",
                "Milk 50%",
                "INGREDIENTS_END",
              ].join("\n"),
            },
            {
              inline_data: { mime_type: mimeType, data: base64Data },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    const ingredients = parseIngredients(raw);

    return new Response(JSON.stringify({ ingredients }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-fridge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: e instanceof GeminiRequestError ? e.status : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseIngredients(raw: string) {
  const blockMatch = raw.match(/INGREDIENTS_START\s*([\s\S]*?)\s*INGREDIENTS_END/i);
  const content = blockMatch?.[1] ?? raw;
  const seen = new Set<string>();

  return content
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 0)
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
