import type { TreeQuota, UsageStats } from "../types";

interface QuotaWidgetProps {
  usage: UsageStats | null;
  treeQuota: TreeQuota | null;
}

function getBarColor(remaining: number, limit: number): string {
  if (limit <= 0) {
    return "bg-gray-500";
  }

  const remainingPct = remaining / limit;

  if (remainingPct > 0.5) {
    return "bg-green-500";
  }
  if (remainingPct >= 0.2) {
    return "bg-yellow-500";
  }
  return "bg-red-500";
}

function formatResetDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MiniProgressBar({
  label,
  used,
  limit,
  remaining,
}: {
  label: string;
  used: number;
  limit: number;
  remaining: number;
}) {
  const usedPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const colorClass = getBarColor(remaining, limit);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500">
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}

export default function QuotaWidget({ usage, treeQuota }: QuotaWidgetProps) {
  if (!usage || !treeQuota) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
        <p className="text-xs text-gray-500">Loading quota...</p>
      </div>
    );
  }

  const apiRemaining = usage.requests_limit - usage.requests_used;
  const showTreeWarning =
    !treeQuota.unlimited && treeQuota.remaining <= 1;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">API Quota</p>
        <p className="text-xs text-gray-400">Resets: {formatResetDate(treeQuota.resets_at)}</p>
      </div>

      <div className="mt-3 space-y-3">
        <MiniProgressBar
          label="API Requests"
          used={usage.requests_used}
          limit={usage.requests_limit}
          remaining={apiRemaining}
        />

        {treeQuota.unlimited ? (
          <div>
            <p className="text-xs text-gray-400">Tree Analyses</p>
            <p className="mt-0.5 text-xs font-medium text-green-400">Unlimited</p>
          </div>
        ) : (
          <MiniProgressBar
            label="Tree Analyses"
            used={treeQuota.used}
            limit={treeQuota.limit}
            remaining={treeQuota.remaining}
          />
        )}
      </div>

      {showTreeWarning && (
        <p className="mt-2 text-xs font-medium text-red-400">⚠ {treeQuota.remaining} tree analysis left this month</p>
      )}
    </div>
  );
}
