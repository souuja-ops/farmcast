import { MapPin, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Farm } from "../types";

interface SelectedCoords {
  lat: number;
  lon: number;
  name: string;
  cropType?: string;
}

interface LocationSearchProps {
  farms: Farm[];
  selectedCoords: SelectedCoords | null;
  onSelect: (coords: SelectedCoords | null) => void;
  onAddFarm: (input: {
    name: string;
    lat: number;
    lon: number;
    cropType: string;
  }) => Promise<Farm>;
  onDeleteFarm: (id: string) => Promise<void>;
}

export default function LocationSearch({
  farms,
  selectedCoords,
  onSelect,
  onAddFarm,
  onDeleteFarm,
}: LocationSearchProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [cropType, setCropType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const farm = await onAddFarm({
        name,
        lat: Number(lat),
        lon: Number(lon),
        cropType,
      });
      onSelect({ lat: farm.lat, lon: farm.lon, name: farm.name, cropType: farm.cropType });
      setName("");
      setLat("");
      setLon("");
      setCropType("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
  <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-400">Locations</h2>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
          selectedCoords === null
            ? "border-primary-500 bg-primary-500/10 text-primary-400"
            : "border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700"
        }`}
      >
        <MapPin className="h-4 w-4 shrink-0" />
        My location (auto-detect)
      </button>

      {farms.map((farm) => (
        <div
          key={farm.id}
          className={`flex w-full items-center gap-2 rounded-lg border transition-colors ${
            selectedCoords?.name === farm.name
              ? "border-primary-500 bg-primary-500/10"
              : "border-gray-800 bg-gray-900"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              onSelect({ lat: farm.lat, lon: farm.lon, name: farm.name, cropType: farm.cropType })
            }
            className="flex flex-1 items-center gap-2 px-3 py-2 text-left text-sm text-gray-300"
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary-500" />
            <div className="truncate">
              <p className="font-medium truncate">{farm.name}</p>
              <p className="text-xs text-gray-500 truncate">{farm.cropType}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => void onDeleteFarm(farm.id)}
            className="px-2 py-2 text-gray-500 hover:text-red-400"
            aria-label={`Delete ${farm.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
          <input
            type="text"
            placeholder="Farm name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
              className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              required
              className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
            />
          </div>
          <input
            type="text"
            placeholder="Crop type"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-300"
        >
          <Plus className="h-4 w-4" />
          Add farm
        </button>
      )}
    </div>
  );
}
