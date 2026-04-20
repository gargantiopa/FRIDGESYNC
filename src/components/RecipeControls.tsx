import { Zap } from "lucide-react";

export type TimeFilter = "15" | "30" | "any";
export type Goal = "zero-waste" | "quick" | "healthy";

interface RecipeControlsProps {
  time: TimeFilter;
  goal: Goal;
  onTimeChange: (t: TimeFilter) => void;
  onGoalChange: (g: Goal) => void;
  onGenerate: () => void;
  generating: boolean;
}

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "any", label: "Any time" },
];

const goalOptions: { value: Goal; label: string; sub: string }[] = [
  { value: "zero-waste", label: "Zero Waste", sub: "Use soonest to expire" },
  { value: "quick", label: "Quick & Easy", sub: "Minimal effort" },
  { value: "healthy", label: "Healthy", sub: "Nutrient focused" },
];

export const RecipeControls = ({
  time,
  goal,
  onTimeChange,
  onGoalChange,
  onGenerate,
  generating,
}: RecipeControlsProps) => {
  return (
    <section className="border-t border-slate-200 pt-6 mt-2">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Find Recipes</h2>

      <div className="space-y-5">
        {/* Time Filter */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Cook Time
          </label>
          <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onTimeChange(opt.value)}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  time === opt.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Goal
          </label>
          <div className="grid grid-cols-1 gap-2">
            {goalOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onGoalChange(opt.value)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  goal === opt.value
                    ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className={`text-sm font-semibold ${goal === opt.value ? "text-emerald-700" : "text-slate-900"}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500">{opt.sub}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    goal === opt.value ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                  }`}
                >
                  {goal === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={onGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          <Zap size={18} strokeWidth={2.5} className={generating ? "animate-pulse" : ""} />
          {generating ? "Generating..." : "Generate Eco-Recipes"}
        </button>
      </div>
    </section>
  );
};
