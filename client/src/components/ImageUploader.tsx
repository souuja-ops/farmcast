import { ImagePlus, Loader2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

interface ImageUploaderProps {
  onUpload: (formData: FormData) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export default function ImageUploader({
  onUpload,
  disabled,
  loading,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [county, setCounty] = useState("");
  const [location, setLocation] = useState("");
  const [landAcres, setLandAcres] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile || disabled || loading) {
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    if (county) {
      formData.append("county", county);
    }
    if (location) {
      formData.append("location", location);
    }
    if (landAcres) {
      formData.append("landAcres", landAcres);
    }
    if (notes) {
      formData.append("notes", notes);
    }

    await onUpload(formData);
  };

  const isDisabled = disabled || loading;

  return (
    <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isDisabled}
        aria-label="Upload canopy image"
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-700 px-4 py-6 text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {preview ? (
          <img
            src={preview}
            alt="Selected canopy"
            className="w-full max-h-56 rounded-lg object-cover"
          />
        ) : (
          <>
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm">Tap to upload a canopy image</span>
            <span className="text-xs text-gray-600">JPEG, PNG, or WEBP — max 20MB</span>
          </>
        )}
      </button>

  <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="County (optional)"
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          disabled={isDisabled}
          className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 disabled:opacity-50"
        />
        <input
          type="text"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isDisabled}
          className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 disabled:opacity-50"
        />
        <input
          type="number"
          step="any"
          placeholder="Land acres (optional)"
          value={landAcres}
          onChange={(e) => setLandAcres(e.target.value)}
          disabled={isDisabled}
          className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 disabled:opacity-50"
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isDisabled}
          className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={isDisabled || !selectedFile}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Analyze Trees
          </>
        )}
      </button>
    </div>
  );
}
