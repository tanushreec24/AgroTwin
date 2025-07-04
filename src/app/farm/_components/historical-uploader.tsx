"use client";

import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export default function HistoricalUploader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = api.historical.uploadHistoricalCSV.useMutation({
    onSuccess: (data) => {
      setLoading(false);
      setSuccess("Upload successful!");
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => {
      setLoading(false);
      setError(err.message);
      setSuccess(null);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = btoa(reader.result as string);
      uploadMutation.mutate({ filename: file.name, fileData: base64 });
    };
    reader.onerror = () => {
      setLoading(false);
      setError("Failed to read file.");
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="historical-upload"
      />
      <Button
        variant="outline"
        className="border-2 bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => document.getElementById("historical-upload")?.click()}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Historical Data (CSV)"}
      </Button>
      {success && <p className="text-green-600 text-sm">{success}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p className="text-xs text-gray-500 mt-2">If no file is uploaded, the system will use only sensor data for training and predictions.</p>
    </div>
  );
} 