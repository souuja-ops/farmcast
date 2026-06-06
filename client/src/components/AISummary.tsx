import { Loader2, Sparkles } from "lucide-react";

interface AISummaryProps {
  summary: string | null;
  loading?: boolean;
}

export default function AISummary({ summary, loading }: AISummaryProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
        <span className="text-sm text-gray-400">Generating AI summary...</span>
      </div>
    );
  }
  // Treat null, undefined, or empty/whitespace-only strings as unavailable
  const hasSummary = typeof summary === "string" && summary.trim().length > 0;

  if (!hasSummary) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-xs text-gray-600">
          AI weather summaries require a Pro plan. Upgrade at weather-ai.co to enable Gemini-powered agronomic insights.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-500" />
        <h3 className="text-sm font-medium text-gray-300">AI Summary</h3>
      </div>
      <p className="text-sm leading-relaxed text-gray-400 break-words">{summary}</p>
    </div>
  );
}
