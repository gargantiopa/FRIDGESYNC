// Cloudflare Worker: generate eco-friendly recipes using Google Gemini AI
// Environment variables required:
//   GEMINI_API_KEY  - Google AI Studio API key

const GRADIENTS = [
  "bg-gradient-to-br from-amber-100 to-orange-200",
  "bg-gradient-to-br from-emerald-100 to-teal-200",
  "bg-gradient-to-br from-yellow-100 to-amber-200",
  "bg-gradient-to-br from-rose-100 to-pink-200",
  "bg-gradient-to-br from-sky-100 to-indigo-200",
  "bg-gradient-to-br from-lime-100 to-green-200",
];

export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      const { ingredients, time, goal } = await request.json();

      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return new Response(JSON.stringify({ error: "No ingredients provided" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const GEMINI_API_KEY = env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

      const timeLabel = time === "any" ? "any duration" : `under ${time} minutes`;
      const goalLabel =
        goal === "zero-waste"
          ? "prioritize using ingredients that spoil soonest and minimize food waste"
          : goal === "quick"
            ? "minimize prep effort and cooking complexity"
            : "maximize nutritional value and balance";

      const prompt = `You are an eco-conscious chef AI for the EcoSync app (year 2026). Generate creative recipes that use only the ingredients the user has in their fridge, plus pantry basics like salt, pepper, oil, and water.

My fridge contains: ${ingredients.join(", ")}.
Cook time: ${timeLabel}.
Goal: ${goalLabel}.

Generate exactly 3 recipes. For each recipe include:
- title: short title
- emoji: a single food emoji
- time: realistic cook time in minutes
- sustainability: High, Medium, or Low
- haveIngredients: percentage from 0 to 100
- steps: 3 to 6 concise steps
- uses: the fridge ingredients used in the recipe

Every recipe must stay realistic and must not invent extra non-pantry ingredients.`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
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
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              response_mime_type: "application/json",
              response_schema: {
                type: "OBJECT",
                properties: {
                  recipes: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        title: { type: "STRING" },
                        emoji: { type: "STRING" },
                        time: { type: "NUMBER" },
                        sustainability: {
                          type: "STRING",
                          enum: ["High", "Medium", "Low"],
                        },
                        haveIngredients: { type: "NUMBER" },
                        steps: {
                          type: "ARRAY",
                          items: { type: "STRING" },
                        },
                        uses: {
                          type: "ARRAY",
                          items: { type: "STRING" },
                        },
                      },
                      required: [
                        "title",
                        "emoji",
                        "time",
                        "sustainability",
                        "haveIngredients",
                        "steps",
                        "uses",
                      ],
                    },
                  },
                },
                required: ["recipes"],
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini error:", response.status, errText);
        throw new Error(`Gemini returned ${response.status}`);
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
      const parsed = JSON.parse(raw);

      const recipes = (parsed.recipes || []).map((r, i) => ({
        id: crypto.randomUUID(),
        title: r.title,
        emoji: r.emoji,
        gradient: GRADIENTS[i % GRADIENTS.length],
        time: r.time,
        haveIngredients: r.haveIngredients,
        sustainability: r.sustainability,
        steps: r.steps || [],
        uses: r.uses || [],
      }));

      return new Response(JSON.stringify({ recipes }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e) {
      console.error("generate-recipes error:", e);
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
