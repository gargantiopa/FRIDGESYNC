import { Clock, Leaf, ChefHat } from "lucide-react";

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  time: number;
  haveIngredients: number;
  sustainability: "High" | "Medium" | "Low";
  steps: string[];
  uses: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  delay: number;
}

const sustainabilityColors = {
  High: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export const RecipeCard = ({ recipe, onClick, delay }: RecipeCardProps) => {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
      className="animate-fade-in-up text-left bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all active:scale-[0.99] group"
    >
      <div
        className={`h-32 ${recipe.gradient} flex items-center justify-center relative overflow-hidden`}
      >
        <span className="text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-500">
          {recipe.emoji}
        </span>
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${sustainabilityColors[recipe.sustainability]}`}>
          <Leaf size={11} className="inline mr-1 -mt-0.5" />
          {recipe.sustainability} Waste Reduction
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-base mb-1.5">{recipe.title}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} strokeWidth={2.25} />
            {recipe.time} min
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="inline-flex items-center gap-1">
            <ChefHat size={12} strokeWidth={2.25} />
            Have {recipe.haveIngredients}% ingredients
          </span>
        </div>
      </div>
    </button>
  );
};
