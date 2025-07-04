import { headers } from "next/headers";
import { type Metadata } from "next";
import { db } from "~/server/db";
import NavBar from "./_components/nav-bar";
import PlaygroundCard from "./_components/playground-card";
import PixelThermometer from "./_components/pixelated-thermometer";
import type { GridItem } from "~/types/grid-item.types";
import type { ActualGrid, ExperimentalGrid } from "@prisma/client";
import { Dockbar } from "./_components/dock";
import { Pointer } from "~/components/magicui/pointer";

export const metadata: Metadata = {
  title: "FarmSimulation",
  description: "AI-powered farm simulation and predictions",
};

type GridData = ActualGrid | ExperimentalGrid;

export default async function Farm() {
  const searchParams = new URLSearchParams(
    (await headers()).get("referer")?.split("?")[1],
  );

  const farmIdParam = searchParams.get("farmId");

  // Fetch all farms
  const farms = await db.farm.findMany({
    orderBy: { name: "asc" },
  });

  const selectedFarmId =
    farms.find((farm) => farm.id === farmIdParam)?.id ?? farms[0]?.id;

  // Convert nullable properties to default values
  const transformGridData = (data: GridData[]): GridItem[] =>
    data.map((grid) => ({
      id: grid.id,
      cropType: grid.cropType ?? "",
      cropCount: grid.cropCount ?? 0,
      waterLevel: grid.waterLevel ?? 0,
      moistureLevel: grid.moistureLevel ?? 0,
      growthStage: grid.growthStage ?? "Seedling",
      row: grid.row,
      column: grid.column,
      farmId: grid.farmId,
      createdAt: grid.createdAt,
      updatedAt: grid.updateAt,
    }));

  // Fetch grid data only for the selected farm
  const [actualGridDataRaw, experimentalGridDataRaw] = await Promise.all([
    db.actualGrid.findMany({
      where: {
        farmId: selectedFarmId,
      },
      orderBy: { id: "asc" },
    }),
    db.experimentalGrid.findMany({
      where: {
        farmId: selectedFarmId,
      },
      orderBy: { id: "asc" },
    }),
  ]);

  const actualGridData = transformGridData(actualGridDataRaw);
  const experimentalGridData = transformGridData(experimentalGridDataRaw);

  return (
    <>
      <div className="min-w-screen pointer-events-none flex min-h-screen flex-col items-center justify-center bg-[#f0fdf4]">
        <NavBar
          farms={farms}
          selectedFarmId={selectedFarmId ?? ""}
        />

        {/* Playground Section */}
        <div className="flex w-full flex-col items-center px-4 py-8">
          <div className="mb-8 text-center">
            <h2 className="mb-2 mt-10 text-2xl font-bold text-[#166534] sm:mt-0 sm:text-3xl">
              Farm Playgrounds
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-[#15803d] sm:text-base">
              Experiment with different variables and see how they affect your
              crop yield in real-time. Use our AI-powered predictions to
              optimize your farming strategy.
            </p>
          </div>
          <div className="flex w-full flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-[100px]">
            <div className="flex flex-row items-center gap-4">
              <PlaygroundCard
                title="Actual Playground"
                gridData={actualGridData ?? []}
              />
              <PixelThermometer gridData={actualGridData ?? []} />
            </div>
            <div className="flex flex-row items-center gap-4">
              <PlaygroundCard
                title="Experimental Playground"
                gridData={experimentalGridData ?? []}
              />
              <PixelThermometer gridData={experimentalGridData ?? []} />
              <Dockbar farmId={selectedFarmId ?? ""} />
            </div>
          </div>
        </div>
      </div>
      <Pointer className="!z-50 fill-[#15803d]" />
    </>
  );
}
