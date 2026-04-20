// Edge function: generate eco-friendly recipes using Google Gemini AI
// Environment variables required:
//   GEMINI_API_KEY  - Google AI Studio API key
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRADIENTS = [
  "bg-gradient-to-br from-amber-100 to-orange-200",
  "bg-gradient-to-br from-emerald-100 to-teal-200",
  "bg-gradient-to-br from-yellow-100 to-amber-200",
  "bg-gradient-to-br from-rose-100 to-pink-200",
  "bg-gradient-to-br from-sky-100 to-indigo-200",
  "bg-gradient-to-br from-lime-100 to-green-200",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, time, goal } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: "No ingredients provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const timeLabel = time === "any" ? "any duration" : `under ${time} minutes`;
    const goalLabel =
      goal === "zero-waste"
        ? "prioritize using ingredients that spoil soonest and minimize food waste"
        : goal === "quick"
          ? "minimize prep effort and cooking complexity"
          : "maximize nutritional value and balance";

    const prompt = `You are an eco-conscious chef AI for the EcoSync app (year 2026). Generate creative recipes that USE ONLY the ingredients the user has in their fridge (plus pantry basics like salt, pepper, oil, water).

My fridge contains: ${ingredients.join(", ")}.
Cook time: ${timeLabel}.
Goal: ${goalLabel}.

Generate exactly 3 recipes. For each: pick a single food emoji, a short title, realistic cook time in minutes, sustainability rating (High/Medium/Low based on how well it reduces waste), the % of recipe ingredients I have (0-100), 3-6 concise step-by-step instructions, and the list of fridge ingredients it uses.

Return ONLY valid JSON, no markdown, no explanation:
{"recipes": [
  {
    "title": "Recipe Title",
    "emoji": "🍳",
    "time": 15,
    "sustainability": "High",
    "haveIngredients": 90,
    "steps": ["Step 1", "Step 2", "Step 3"],
    "uses": ["Ingredient1", "Ingredient2"]
  }
]}`;

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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
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

    const recipes = (parsed.recipes || []).map((r: Record<string, unknown>, i: number) => ({
      id: crypto.randomUUID(),
      title: r.title as string,
      emoji: r.emoji as string,
      gradient: GRADIENTS[i % GRADIENTS.length],
      time: r.time as number,
      haveIngredients: r.haveIngredients as number,
      sustainability: r.sustainability as "High" | "Medium" | "Low",
      steps: (r.steps as string[]) || [],
      uses: (r.uses as string[]) || [],
    }));

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recipes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
