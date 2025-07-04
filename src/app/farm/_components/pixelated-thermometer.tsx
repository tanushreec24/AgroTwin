"use client";

import { useState, useEffect } from "react";
import type { GridItem } from "~/types/grid-item.types";

interface PixelThermometerProps {
  gridData: GridItem[];
  width?: number;
  height?: number;
}

export default function PixelThermometer({
  gridData,
  width = 15,
}: PixelThermometerProps) {
  const [temperature, setTemperature] = useState(24);

  useEffect(() => {
    if (gridData.length === 0) {
      setTemperature(0);
      return;
    }

    const avgWaterLevel =
      gridData.reduce((sum, cell) => sum + (cell.waterLevel || 1), 0) /
      gridData.length;

    // Map water level to temperature range
    const tempRange: [number] =
      avgWaterLevel <= 1
        ? [34] // Dry (Hot)
        : avgWaterLevel <= 2
          ? [26] // Moderate (Warm)
          : [13]; // Wet (Cool)

    const newTemp =
      Math.floor(Math.random() * (tempRange[0] - tempRange[0] + 1)) +
      tempRange[0];

    setTemperature(newTemp);
  }, [gridData]);

  const fillPercentage = ((temperature - 10) / (40 - 10)) * 100;

  const getColor = (temp: number) => {
    if (temp > 32) return "#DC2626"; // Hot (Red)
    if (temp > 22) return "#059669"; // Warm (Green)
    return "#3B82F6"; // Cool (Blue)
  };

  return (
    <div className="inline-flex flex-col items-center gap-1 px-2 pt-[5rem] sm:pt-[5rem]">
      <div
        className="relative h-[120px] overflow-hidden rounded-lg bg-[#1E1E1E] sm:h-[310px]"
        style={{
          width: `${width}px`,
          border: "2px solid #2D2D2D",
          boxShadow: "inset 0 0 0 2px #171717",
        }}
      >
        <div
          className="absolute bottom-0 w-full transition-all duration-1000 ease-in-out"
          style={{
            height: `${fillPercentage}%`,
            backgroundColor: getColor(temperature),
            boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.2)",
          }}
        />
      </div>
      <div
        className="w-[30px] rounded px-1 text-[14px] font-bold"
        style={{
          color: getColor(temperature),
        }}
      >
        {temperature}°
      </div>
    </div>
  );
}
