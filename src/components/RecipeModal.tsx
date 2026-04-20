import { X, Clock, Leaf, ChefHat, Sparkles } from "lucide-react";
import { Recipe } from "./RecipeCard";
import { useEffect } from "react";

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export const RecipeModal = ({ recipe, onClose }: RecipeModalProps) => {
  useEffect(() => {
    if (recipe) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [recipe]);

  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <div className={`h-40 ${recipe.gradient} flex items-center justify-center relative`}>
          <span className="text-7xl drop-shadow">{recipe.emoji}</span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">{recipe.title}</h2>

          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              <Clock size={12} /> {recipe.time} min
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              <ChefHat size={12} /> {recipe.haveIngredients}% ingredients
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
              <Leaf size={12} /> {recipe.sustainability} Waste Reduction
            </span>
          </div>

          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Uses from your fridge</h3>
            <div className="flex flex-wrap gap-1.5">
              {recipe.uses.map((u) => (
                <span key={u} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-medium">
                  {u}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles size={12} /> Step-by-step
            </h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            Start Cooking
          </button>
        </div>
      </div>
    </div>
  );
};
