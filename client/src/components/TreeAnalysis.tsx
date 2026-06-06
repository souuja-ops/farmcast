import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { TreeAnalysisResult } from "../types";

interface TreeAnalysisProps {
  result: TreeAnalysisResult | null;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-2xl font-semibold text-gray-100">{value}</p>
        {badge}
      </div>
    </div>
  );
}

function HealthBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">
          {count} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function TreeAnalysis({ result, loading }: TreeAnalysisProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const densityDisplay =
    result.tree_density_per_acre !== undefined && result.tree_density_per_acre !== null
      ? `${result.tree_density_per_acre.toFixed(1)} / acre`
      : "N/A — provide acreage";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Trees"
          value={(result.total_tree_count ?? 0).toString()}
        />
        <StatCard
          label="Confidence"
          value={`${((result.confidence_score ?? 0) * 100).toFixed(0)}%`}
          badge={
            result.low_confidence ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                <AlertTriangle className="h-3 w-3" />
                Low confidence
              </span>
            ) : undefined
          }
        />
        <StatCard
          label="Canopy Coverage"
          value={`${result.canopy_coverage_pct ?? 0}%`}
        />
        <StatCard label="Density" value={densityDisplay} />
      </div>

      {result.tree_species_guess && (
        <div>
          <span className="inline-block rounded-full bg-teal-800 px-3 py-1 text-sm text-teal-100">
            Detected species: {result.tree_species_guess}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
          <p className="border-b border-gray-800 px-4 py-2 text-sm font-medium text-gray-400">
            Original Image
          </p>
          {result.original_image_url ? (
            <img
              src={result.original_image_url}
              alt="Original tree canopy"
              className="h-64 w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="h-64 w-full bg-gray-800/30" />
          )}
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
          <p className="border-b border-gray-800 px-4 py-2 text-sm font-medium text-gray-400">
            Analysis Overlay
          </p>
          {result.overlay_image_url ? (
            <img
              src={result.overlay_image_url}
              alt="Tree analysis overlay"
              className="h-64 w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="h-64 w-full bg-gray-800/30" />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-4 text-sm font-medium text-gray-300">
          Tree Health Breakdown
        </h3>
        <div className="space-y-3">
          <HealthBar
            label="Healthy"
            count={result.tree_health.healthy}
            total={result.total_tree_count}
            colorClass="bg-green-500"
          />
          <HealthBar
            label="Needs Care"
            count={result.tree_health.needs_care}
            total={result.total_tree_count}
            colorClass="bg-yellow-500"
          />
          <HealthBar
            label="Needs Replacement"
            count={result.tree_health.needs_replacement}
            total={result.total_tree_count}
            colorClass="bg-red-500"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-300">
            Observations
          </h3>
          {(result.observations ?? []).length > 0 ? (
            <ul className="space-y-2">
              {(result.observations ?? []).map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-gray-400 before:mt-1.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-primary-500 before:content-['']"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No observations recorded.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-300">
            Recommendations
          </h3>
          {(result.recommendations ?? []).length > 0 ? (
            <ul className="space-y-2">
              {(result.recommendations ?? []).map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-gray-400 before:mt-1.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-primary-500 before:content-['']"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              No recommendations available.
            </p>
          )}
        </div>
      </div>
      {result.cv_debug && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-gray-600">
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            CV Debug
          </summary>
          <div className="mt-2 rounded border border-gray-800 bg-gray-900/50 px-3 py-2 font-mono text-xs text-gray-600">
            <p>orig_resolution: {result.cv_debug.orig_resolution ?? "—"}</p>
            <p>peaks_detected: {result.cv_debug.peaks_detected ?? "—"}</p>
            <p>after_area_filter: {result.cv_debug.after_area_filter ?? "—"}</p>
          </div>
        </details>
      )}
    </div>
  );
}
