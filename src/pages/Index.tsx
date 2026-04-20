import { useState } from "react";
import { Leaf } from "lucide-react";
import { SmartFridge } from "@/components/SmartFridge";
import { RecipeControls, TimeFilter, Goal } from "@/components/RecipeControls";
import { RecipeCard, Recipe } from "@/components/RecipeCard";
import { RecipeModal } from "@/components/RecipeModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFunctionErrorMessage } from "@/lib/function-errors";

const Index = () => {
  const [ingredients, setIngredients] = useState<string[]>([
    "Eggs x6",
    "Cheese",
    "Spinach",
    "Tomato x3",
    "Milk 50%",
  ]);
  const [time, setTime] = useState<TimeFilter>("15");
  const [goal, setGoal] = useState<Goal>("zero-waste");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);

  const handleAdd = (item: string) => {
    setIngredients((current) => {
      if (current.includes(item)) return current;
      return [...current, item];
    });
  };

  const handleRemove = (item: string) => {
    setIngredients((current) => current.filter((i) => i !== item));
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast.error("Add some ingredients first!");
      return;
    }
    setGenerating(true);
    setRecipes([]);
    let response: Response | undefined;
    try {
      const result = await supabase.functions.invoke("generate-recipes", {
        body: { ingredients, time, goal },
      });
      const { data, error } = result;
      response = result.response;
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecipes(data.recipes || []);
      if (!data.recipes?.length) toast.error("No recipes returned. Try again.");
    } catch (e) {
      console.error(e);
      const msg = await getFunctionErrorMessage(e, response, "Failed to generate recipes");
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-6 pb-16">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <Leaf className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">EcoSync AI</h1>
              <p className="text-xs text-slate-500">Smart Recipe Assistant</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Saved this week</div>
            <div className="text-sm font-semibold text-emerald-600">$24 · 2.1kg</div>
          </div>
        </header>

        {/* Section 1: Fridge */}
        <SmartFridge
          ingredients={ingredients}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />

        {/* Section 2: Controls */}
        <div className="mt-6">
          <RecipeControls
            time={time}
            goal={goal}
            onTimeChange={setTime}
            onGoalChange={setGoal}
            onGenerate={handleGenerate}
            generating={generating}
          />
        </div>

        {/* Section 3: Results */}
        {(recipes.length > 0 || generating) && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {generating ? "Cooking up ideas..." : "AI Recipe Matches"}
              </h2>
              {!generating && (
                <span className="text-xs text-slate-500">{recipes.length} found</span>
              )}
            </div>

            {generating ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"
                  >
                    <div className="h-32 bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {recipes.map((r, i) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    onClick={() => setSelected(r)}
                    delay={i * 100}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <RecipeModal recipe={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
