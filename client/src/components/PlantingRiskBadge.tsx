import { Loader2 } from "lucide-react";
import type { PlantingRisk } from "../types";

interface PlantingRiskBadgeProps {
  risk: PlantingRisk | null;
  loading?: boolean;
}

const labelStyles: Record<PlantingRisk["label"], string> = {
  Low: "bg-green-500/20 text-green-400 border-green-500/30",
  Moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function PlantingRiskBadge({
  risk,
  loading,
}: PlantingRiskBadgeProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
        <span className="text-sm text-gray-400">Assessing planting risk...</span>
      </div>
    );
  }

  if (!risk) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-sm font-medium ${labelStyles[risk.label]}`}
          >
            {risk.label} Risk
          </span>
          <span className="text-sm text-gray-500">Score: {risk.score}/100</span>
        </div>
        <div className="text-sm text-gray-400 max-w-prose break-words">{risk.reason}</div>
      </div>
    </div>
  );
}
