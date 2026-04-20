// Edge function: detect ingredients from a fridge photo using Google Gemini AI
// Environment variables required:
//   GEMINI_API_KEY  - Google AI Studio API key
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Strip data URL prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: [
                    "You are an expert food vision system for a smart-fridge app. Carefully analyze the photo and identify EVERY distinct edible food item or ingredient you can see, including items that are partially visible, behind glass, in containers, jars, bottles, bags, or wrapped in packaging.",
                    "",
                    "Rules:",
                    "- Inspect the image methodically from top shelf to bottom shelf, then drawers, then every door compartment.",
                    "- Read labels on packaging when visible (e.g. Greek Yogurt, Oat Milk, Cheddar Cheese, Butter, Strawberry Jam).",
                    "- Return as many valid food items as you can confidently identify; do not stop early after the first few items.",
                    "- Use short, generic, human-friendly names in Title Case.",
                    "- Include quantity or volume when reasonably visible:",
                    "    - countable items: 'Eggs x6', 'Tomatoes x3', 'Apples x4'",
                    "    - liquids/containers: 'Milk 1L', 'Orange Juice 500ml', 'Yogurt 250g'",
                    "    - partially used: 'Milk 50%', 'Butter (half)'",
                    "- Distinguish similar items when possible: Whole Milk vs Oat Milk, Cheddar vs Mozzarella, Red Bell Pepper vs Green Bell Pepper.",
                    "- Include condiments and sauces if clearly visible.",
                    "- Deduplicate repeated sightings of the same item and combine them into one entry with quantity.",
                    "- Skip non-food objects, brand-only names without a recognizable food, and uncertain guesses.",
                    "- If the photo is clearly not a fridge or contains no visible food, return an empty list.",
                    "",
                    "Return ONLY valid JSON, no markdown, no explanation:",
                    '{"ingredients": ["item1", "item2"]}',
                  ].join("\n"),
                },
                {
                  inline_data: { mime_type: mimeType, data: base64Data },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      throw new Error(`Gemini returned ${response.status}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const ingredients: string[] = (parsed.ingredients || [])
      .filter((s: unknown) => typeof s === "string" && s.trim().length > 0)
      .map((s: string) => s.trim());

    return new Response(JSON.stringify({ ingredients }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-fridge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
