// Edge function: generate eco-friendly recipes using Google Gemini AI
// Environment variables required:
//   GEMINI_API_KEY  - Google AI Studio API key
import { GeminiRequestError, generateGeminiText } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

Generate exactly 3 recipes.
Every recipe must stay realistic and must not invent extra non-pantry ingredients.

Return only this exact plain-text structure:
RECIPE_START
Title: Quick Spinach Eggs
Emoji: 🍳
Time: 12
Sustainability: High
HaveIngredients: 100
Uses: Eggs x6 | Spinach | Cheese
Steps:
- Beat the eggs.
- Cook the spinach briefly.
- Add the eggs and cheese and finish until set.
RECIPE_END`;

    const raw = await generateGeminiText({
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
      },
    });

    const recipes = parseRecipes(raw).map((r, i) => ({
      id: crypto.randomUUID(),
      title: r.title,
      emoji: r.emoji,
      gradient: GRADIENTS[i % GRADIENTS.length],
      time: r.time,
      haveIngredients: r.haveIngredients,
      sustainability: r.sustainability,
      steps: r.steps,
      uses: r.uses,
    }));

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recipes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: e instanceof GeminiRequestError ? e.status : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

type ParsedRecipe = {
  title: string;
  emoji: string;
  time: number;
  haveIngredients: number;
  sustainability: "High" | "Medium" | "Low";
  steps: string[];
  uses: string[];
};

function parseRecipes(raw: string): ParsedRecipe[] {
  const blocks = [...raw.matchAll(/RECIPE_START\s*([\s\S]*?)\s*RECIPE_END/gi)].map((match) => match[1]);
  const sourceBlocks = blocks.length > 0 ? blocks : [raw];

  const recipes = sourceBlocks
    .map((block) => parseRecipeBlock(block))
    .filter((recipe): recipe is ParsedRecipe => recipe !== null)
    .slice(0, 3);

  if (recipes.length === 0) {
    throw new Error("Gemini returned no parseable recipes");
  }

  return recipes;
}

function parseRecipeBlock(block: string): ParsedRecipe | null {
  const title = matchField(block, "Title");
  const emoji = matchField(block, "Emoji") || "🍽️";
  const sustainabilityRaw = matchField(block, "Sustainability");
  const sustainability = normalizeSustainability(sustainabilityRaw);
  const time = toBoundedNumber(matchField(block, "Time"), 5, 180, 15);
  const haveIngredients = toBoundedNumber(matchField(block, "HaveIngredients"), 0, 100, 80);
  const uses = splitPipeList(matchField(block, "Uses"));
  const steps = parseSteps(block);

  if (!title || !sustainability || steps.length === 0) {
    return null;
  }

  return {
    title,
    emoji,
    time,
    haveIngredients,
    sustainability,
    steps,
    uses,
  };
}

function matchField(block: string, label: string) {
  const match = block.match(new RegExp(`^${label}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function normalizeSustainability(value: string): "High" | "Medium" | "Low" | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  if (normalized === "low") return "Low";
  return null;
}

function toBoundedNumber(value: string, min: number, max: number, fallback: number) {
  const match = value.match(/\d+/);
  if (!match) return fallback;

  const parsed = Number(match[0]);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function splitPipeList(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSteps(block: string) {
  const stepsMatch = block.match(/Steps:\s*([\s\S]*)$/i);
  const stepsSource = stepsMatch?.[1] ?? block;

  return stepsSource
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(Title|Emoji|Time|Sustainability|HaveIngredients|Uses):/i.test(line))
    .slice(0, 6);
}
