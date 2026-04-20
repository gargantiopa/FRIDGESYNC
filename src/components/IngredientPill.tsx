import { X } from "lucide-react";

interface IngredientPillProps {
  name: string;
  onRemove: () => void;
}

export const IngredientPill = ({ name, onRemove }: IngredientPillProps) => {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-900 text-sm font-medium pl-3 pr-1.5 py-1.5 rounded-full shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
      {name}
      <button
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="ml-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 transition-colors"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </span>
  );
};
