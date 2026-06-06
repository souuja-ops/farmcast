import { CloudRain, Loader2, Thermometer, Wind } from "lucide-react";
import type { WeatherDay, WeatherCurrent } from "../types";

interface ForecastGridProps {
  daily: WeatherDay[];
  current?: WeatherCurrent;
  loading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function DayCard({ day, isToday }: { day: WeatherDay; isToday?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isToday
          ? "border-primary-500/50 bg-primary-500/5"
          : "border-gray-800 bg-gray-900"
      }`}
    >
      <p className="text-xs font-medium text-gray-500">
        {isToday ? "Today" : formatDate(day.date)}
      </p>
  {/* condition_code is represented by the icon; remove textual code */}
      <div className="mt-3 flex items-center gap-1 text-sm text-gray-300">
        <Thermometer className="h-3.5 w-3.5 text-primary-500" />
        <span>
          {day.temp_max}° / {day.temp_min}°
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
        <CloudRain className="h-3.5 w-3.5" />
        <span>{day.precipitation_probability}% rain</span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
        <Wind className="h-3.5 w-3.5" />
        <span>{day.wind_max} km/h</span>
      </div>
      <div className="mt-2">
        <img src={day.icon} alt={day.condition_code} className="h-8 w-8" />
      </div>
    </div>
  );
}

export default function ForecastGrid({
  daily,
  current,
  loading,
}: ForecastGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-900 py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (daily.length === 0 && !current) {
    return (
      <p className="text-sm text-gray-500">No forecast data available.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {current && (
        <div className="col-span-full sm:col-span-1">
          <div className="rounded-lg border p-4 border-primary-500/50 bg-primary-500/5">
            <p className="text-xs font-medium text-gray-500">Today</p>
            {/* condition_code is represented by the icon; removed textual code */}
            <div className="mt-3 flex items-center gap-1 text-sm text-gray-300">
              <Thermometer className="h-3.5 w-3.5 text-primary-500" />
              <span>{current.temperature}°C</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <CloudRain className="h-3.5 w-3.5" />
              <span>—</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <Wind className="h-3.5 w-3.5" />
              <span>{current.wind_speed} km/h</span>
            </div>
            <div className="mt-2">
              <img src={current.icon} alt={current.condition_code} className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
            </div>
          </div>
        </div>
      )}
      {daily.map((day) => (
        <DayCard key={day.date} day={day} />
      ))}
    </div>
  );
}
