import { Sparkles } from "lucide-react";

export function DemoBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50 demo-badge rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-warm">
      <Sparkles className="w-3.5 h-3.5" /> Demo Mode
    </div>
  );
}
