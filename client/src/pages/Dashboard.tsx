import { signOut } from "firebase/auth";
import { CloudSun, LogOut, TreePine, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AISummary from "../components/AISummary";
import ForecastGrid from "../components/ForecastGrid";
import ImageUploader from "../components/ImageUploader";
import LocationSearch from "../components/LocationSearch";
import PlantingRiskBadge from "../components/PlantingRiskBadge";
import QuotaWidget from "../components/QuotaWidget";
import TreeAnalysis from "../components/TreeAnalysis";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useFarms } from "../hooks/useFarms";
import { useQuota } from "../hooks/useQuota";
import { useTreeAnalysis } from "../hooks/useTreeAnalysis";
import { useWeather } from "../hooks/useWeather";
import { useWeatherGeo } from "../hooks/useWeatherGeo";
import { auth } from "../lib/firebase";

function formatResetDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lon: number;
    name: string;
    cropType?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"weather" | "trees">("weather");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const {
    weather: geoWeather,
    plantingRisk: geoRisk,
    geo,
    loading: geoLoading,
  } = useWeatherGeo();

  const {
    weather,
    plantingRisk,
    loading: weatherLoading,
    error: weatherError,
  } = useWeather({
    lat: selectedCoords?.lat ?? null,
    lon: selectedCoords?.lon ?? null,
    cropType: selectedCoords?.cropType,
  });

  const {
    analyzeImage,
    result: treeResult,
    loading: treeLoading,
    error: treeError,
    loadLatestFromHistory,
  } = useTreeAnalysis();

  const { farms, addFarm, deleteFarm } = useFarms();
  const { usage, treeQuota } = useQuota();

  useEffect(() => {
    if (farms.length > 0 && !hasAutoSelected) {
      const first = farms[0];
      setSelectedCoords({
        lat: first.lat,
        lon: first.lon,
        name: first.name,
        cropType: first.cropType,
      });
      setHasAutoSelected(true);
    }
  }, [farms, hasAutoSelected]);

  // Keep sidebar open on large screens, closed on small screens
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const set = (matches: boolean) => setSidebarOpen(matches);
    set(mq.matches);
    // handle changes
    const handler = (e: MediaQueryListEvent) => set(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler as any);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler as any);
    };
  }, []);

  const usingFarmWeather = selectedCoords !== null;
  const activeWeather = usingFarmWeather ? weather : geoWeather;
  const activePlantingRisk = usingFarmWeather ? plantingRisk : geoRisk;
  const isWeatherLoading = usingFarmWeather ? weatherLoading : geoLoading;
  const showGeoBanner = !usingFarmWeather && geo !== null;

  const quotaExhausted =
    treeQuota !== null && !treeQuota.unlimited && treeQuota.remaining === 0;

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleDeleteFarm = async (id: string) => {
    const deleted = farms.find((farm) => farm.id === id);
    await deleteFarm(id);

    if (deleted && selectedCoords?.name === deleted.name) {
      const remaining = farms.filter((farm) => farm.id !== id);
      if (remaining.length > 0) {
        const next = remaining[0];
        setSelectedCoords({
          lat: next.lat,
          lon: next.lon,
          name: next.name,
        });
      } else {
        setSelectedCoords(null);
        setHasAutoSelected(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className={`${sidebarOpen ? "flex" : "hidden"} w-72 shrink-0 flex-col border-r border-gray-800 bg-gray-900 p-4 lg:flex`}>
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-100">FarmCast</h1>
          <p className="text-xs text-gray-500">Agri-weather intelligence</p>
        </div>

          <LocationSearch
          farms={farms}
          selectedCoords={selectedCoords}
          onSelect={setSelectedCoords}
          onAddFarm={addFarm}
          onDeleteFarm={handleDeleteFarm}
        />

          <div className="mt-auto space-y-3 pt-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("weather")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "weather"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-gray-300"
              }`}
            >
              <CloudSun className="h-4 w-4" />
              Weather
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("trees")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "trees"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-gray-300"
              }`}
            >
              <TreePine className="h-4 w-4" />
              Trees
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-400 hover:border-gray-700 hover:text-gray-300"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-auto">
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1 text-gray-400 hover:text-gray-200 lg:hidden"
                onClick={() => setSidebarOpen((s) => !s)}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-semibold text-gray-100">
            {activeTab === "weather" ? "Weather Forecast" : "Tree Analysis"}
              </h2>
            </div>

            {usingFarmWeather && selectedCoords && (
              <p className="mt-1 hidden text-sm text-gray-500 lg:block">
                Showing weather for {selectedCoords.name}
              </p>
            )}
          </div>
        </header>

        <div className="flex-1 px-6 py-6">
          {activeTab === "weather" && (
            <div className="mx-auto max-w-4xl space-y-5">
              {showGeoBanner && geo?.countryCode && (
                <div className="inline-flex rounded-full bg-teal-900/50 
                  px-3 py-1 text-sm text-teal-300">
                  Showing weather for your location ({geo.countryCode})
                </div>
              )}

              {weatherError && usingFarmWeather && (
                <p className="text-sm text-red-400">{weatherError}</p>
              )}

              <PlantingRiskBadge
                risk={activePlantingRisk}
                loading={isWeatherLoading}
              />

              <AISummary
                summary={activeWeather?.ai_summary ?? null}
                loading={isWeatherLoading}
              />

              <ForecastGrid
                daily={activeWeather?.daily ?? []}
                current={activeWeather?.current}
                loading={isWeatherLoading}
              />

              <div className="opacity-75">
                <QuotaWidget usage={usage} treeQuota={treeQuota} />
              </div>
            </div>
          )}

          {activeTab === "trees" && (
            <div className="mx-auto max-w-4xl space-y-5">
              <QuotaWidget usage={usage} treeQuota={treeQuota} />

              {quotaExhausted && treeQuota && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  Tree analysis quota exhausted for this month. Resets{" "}
                  {formatResetDate(treeQuota.resets_at)}.
                </div>
              )}

              <ImageUploader
                onUpload={analyzeImage}
                disabled={quotaExhausted}
                loading={treeLoading}
              />

              {treeError && (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-red-400">{treeError}</p>
                  <button
                    type="button"
                    onClick={() => void loadLatestFromHistory()}
                    className="rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:border-gray-600"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!treeLoading && !treeResult && (
                <button
                  type="button"
                  onClick={() => void loadLatestFromHistory()}
                  className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-300"
                >
                  Load last analysis
                </button>
              )}

              {treeLoading && (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 opacity-60"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </button>
              )}

              <ErrorBoundary>
                <TreeAnalysis result={treeResult} loading={treeLoading} />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
