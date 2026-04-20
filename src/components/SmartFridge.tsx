import { useRef, useState } from "react";
import { Camera, Plus, Refrigerator } from "lucide-react";
import { IngredientPill } from "./IngredientPill";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFunctionErrorMessage } from "@/lib/function-errors";

interface SmartFridgeProps {
  ingredients: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
}

export const SmartFridge = ({ ingredients, onAdd, onRemove }: SmartFridgeProps) => {
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onAdd(trimmed);
      setInput("");
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas is not available for image processing"));
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };

      image.src = objectUrl;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setScanning(true);
    let response: Response | undefined;
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await supabase.functions.invoke("scan-fridge", {
        body: { image: dataUrl },
      });
      const { data, error } = result;
      response = result.response;
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const detected: string[] = data?.ingredients || [];
      if (detected.length === 0) {
        toast.error("No ingredients detected. Try a clearer photo.");
        return;
      }
      const existingLower = new Set(ingredients.map((i) => i.toLowerCase()));
      let added = 0;
      detected.forEach((item) => {
        if (!existingLower.has(item.toLowerCase())) {
          onAdd(item);
          existingLower.add(item.toLowerCase());
          added++;
        }
      });
      toast.success(
        added > 0
          ? `Added ${added} new item${added === 1 ? "" : "s"} from your photo`
          : "All detected items are already in your fridge"
      );
    } catch (err) {
      console.error(err);
      toast.error(await getFunctionErrorMessage(err, response, "Failed to scan image"));
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Refrigerator className="text-emerald-600" size={18} strokeWidth={2.25} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 leading-tight">My Smart Fridge</h2>
          <p className="text-xs text-slate-500">{ingredients.length} items available</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
        {ingredients.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Your fridge is empty. Scan or add items below.</p>
        ) : (
          ingredients.map((item) => (
            <IngredientPill key={item} name={item} onRemove={() => onRemove(item)} />
          ))
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleScanClick}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-sm mb-3"
      >
        <Camera size={18} strokeWidth={2.25} />
        {scanning ? "Analyzing photo..." : "Scan Fridge Contents"}
      </button>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="+ Add item manually..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-medium text-sm rounded-xl transition-colors flex items-center gap-1"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
    </section>
  );
};
