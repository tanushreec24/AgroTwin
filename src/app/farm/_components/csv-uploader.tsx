"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { Button } from "~/components/ui/button";
import { Sprout } from "lucide-react";
import type { CropData } from "~/types/crop.types";
import { api } from "~/trpc/react";

// Simple UUID generator that works in browsers
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function CsvUploader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const importCSV = api.playground.importCSV.useMutation({
    onSuccess: () => {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    },
    onError: (err) => {
      setLoading(false);
      setError(err.message);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    Papa.parse<CropData>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results: ParseResult<CropData>) => {
        if (results.errors.length) {
          setLoading(false);
          setError("Error parsing CSV file.");
          console.error("CSV Parsing Errors:", results.errors);
          return;
        }

        const parsedData = results.data.map((row, index) => ({
          id: generateUUID(),
          cropType: row.cropType ?? "",
          cropCount: Number(row.cropCount) ?? 0,
          waterLevel: Number(row.waterLevel) ?? 0,
          moistureLevel: Number(row.moistureLevel) ?? 0,
          growthStage: row.growthStage ?? "Seedling",
          row: Number(row.row) ?? Math.floor(index / 6),
          column: Number(row.column) ?? index % 6,
        }));

        if (!parsedData.length) {
          setLoading(false);
          setError("No valid data found in CSV.");
          return;
        }

        // Auto-import parsed data
        importCSV.mutate({ data: parsedData });
      },
    });
  };

  return (
    <div className="pointer-events-auto flex cursor-none flex-col items-center gap-2 sm:gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
      />

      <Button
        variant="outline"
        className="pointer-events-auto w-full cursor-none border-2 bg-[#15803d] text-white hover:bg-[#15803d]/80 hover:text-white sm:w-auto"
        onClick={() => document.getElementById("file-upload")?.click()}
        disabled={loading}
      >
        {loading ? (
          "Importing..."
        ) : (
          <>
            <Sprout className="mr-2 h-4 w-4" /> Create New Farm
          </>
        )}
      </Button>

      {error && <p className="text-sm text-red-500 sm:text-base">{error}</p>}
    </div>
  );
}
