"use client";

import { useState, useEffect } from "react";
import type { GridItem } from "~/types/grid-item.types";

interface PixelHeatMapProps {
  gridData: GridItem[];
  pixelSize?: number;
}

export default function PixelHeatMap({
  gridData,
  pixelSize = 13,
}: PixelHeatMapProps) {
  const rows = 3;
  const cols = 4;
  const [waterLevels, setWaterLevels] = useState<number[][]>([]);

  useEffect(() => {
    const generateWaterLevels = () => {
      const newLevels = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          const gridItem = gridData[i * cols + j];
          row.push(gridItem ? gridItem.waterLevel : 1); // Default to level 1 if no data
        }
        newLevels.push(row);
      }
      setWaterLevels(newLevels);
    };

    generateWaterLevels();
  }, [gridData]);

  const getColor = (level: number) => {
    switch (level) {
      case 1:
        return "#ef4444"; // Red (low water level)
      case 2:
        return "#3b82f6"; // Blue (medium water level)
      case 3:
        return "#22c55e"; // Green (high water level)
      default:
        return "#d1d5db"; // Gray (unknown level)
    }
  };

  if (waterLevels.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="inline-block overflow-hidden rounded-sm border-2 border-gray-800 bg-gray-900"
      style={{
        imageRendering: "pixelated",
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${pixelSize}px)`,
        gap: "1px",
      }}
    >
      {waterLevels.map((row, i) =>
        row.map((level, j) => (
          <div
            key={`${i}-${j}`}
            style={{
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor: getColor(level),
            }}
          />
        )),
      )}
    </div>
  );
}
