"use client";

import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { toast } from "sonner";
import type { GridItem } from "~/types/grid-item.types";
import { Button } from "~/components/ui/button";
import PixelHeatMap from "./pixelated-heat-map";
import { ApplyParamsPopover } from "./apply-params-popover";
import { api } from "~/trpc/react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRouter } from "next/navigation";

interface CropDetailsProps {
  grid: GridItem;
}

const CropDetails = ({ grid }: CropDetailsProps) => {
  if (!grid.cropType) {
    return (
      <div>
        <h1 className="text-base font-semibold text-[#166534]">Empty farm</h1>
        <p className="text-sm text-[#15803d]">Click the🌾Farm button.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-base font-semibold text-[#166534]">Crop Details</h1>
      <p className="text-sm text-[#15803d]">See how your crops are doing.</p>
      <hr className="my-2 border-[#15803d]" />
      <div className="space-y-1">
        {[
          { label: "Crop Type", value: grid.cropType },
          { label: "Crop Count", value: grid.cropCount },
          { label: "Growth Stage", value: grid.growthStage ?? "Seedling" },
          { label: "Water Level", value: grid.waterLevel },
          { label: "Moisture Level", value: grid.moistureLevel },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="font-medium text-[#166534]">{label}:</span>
            <span className="text-sm text-[#15803d]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface GridCellProps {
  grid: GridItem;
  isExperimental: boolean;
  getEmojiSize: (growthStage?: string) => string;
}

const GridCell = ({ grid, isExperimental, getEmojiSize }: GridCellProps) => {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("selectedTool")
      : null,
  );
  const [amount, setAmount] = useState(0);

  const { mutateAsync: updateCell } =
    api.playground.updateExperimentalCell.useMutation();

  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedTool(sessionStorage.getItem("selectedTool"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const determineWaterLevel = (water: number) => {
    if (water < 30) return 1;
    if (water <= 70) return 2;
    return 3;
  };

  const handleApply = async (amount: number, weather: string) => {
    try {
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
      );
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Crop Details:
                      - Crop Type: ${grid.cropType}
                      - Crop Count: ${grid.cropCount}
                      - Current Water Level: ${grid.waterLevel} L
                      - Moisture Level: ${grid.moistureLevel}%
                      - Growth Stage: ${grid.growthStage}

                      Input Parameters:
                      - Water Applied: ${selectedTool === "water" ? amount : 0} L
                      - Fertilizer Applied: ${selectedTool === "fertilizer" ? amount : 0} g
                      - Pesticide Applied: ${selectedTool === "pesticide" ? amount : 0} ml
                      - Weather Condition: ${weather}

                      ### Instructions:
                      Analyze the given crop details and input parameters to provide the following:

                      Suggestions:
                      Water to apply: {optimal amount in liters}
                      Fertilizer to apply: {optimal amount in grams}
                      Pesticide to apply: {optimal amount in milliliters per liter of water}

                      Predictions:
                      Predict the crop's condition in the next few days, including any risks. (Concise, One Sentence)

                      Don't add any font stylings, like bold or italic, remove any symbols like dashes and underscores`;

      const result = (await model.generateContent(prompt)).response.text();
      const predictionMatch = /Predictions:\n(.+)/.exec(result);
      const message = predictionMatch?.[1]?.trim() ?? "Prediction not found.";

      const waterRegex = /Water to apply:\s*(\d+\.?\d*)/;
      const fertilizerRegex = /Fertilizer to apply:\s*(\d+\.?\d*)/;
      const pesticideRegex = /Pesticide to apply:\s*(\d+\.?\d*)/;

      const waterMatch = waterRegex.exec(result);
      const fertilizerMatch = fertilizerRegex.exec(result);
      const pesticideMatch = pesticideRegex.exec(result);

      const suggestedWater = waterMatch?.[1] ? parseFloat(waterMatch[1]) : 0;
      const suggestedFertilizer = fertilizerMatch?.[1]
        ? parseFloat(fertilizerMatch[1])
        : 0;
      const suggestedPesticide = pesticideMatch?.[1]
        ? parseFloat(pesticideMatch[1])
        : 0;

      // Determine new crop state
      const newWaterLevel =
        selectedTool === "water"
          ? determineWaterLevel(amount)
          : grid.waterLevel;
      const newMoistureLevel =
        selectedTool === "water"
          ? Math.min(10, Math.floor(amount / 10))
          : grid.moistureLevel;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "suggestions",
          JSON.stringify({
            suggestedWater,
            suggestedFertilizer,
            suggestedPesticide,
          }),
        );
        window.dispatchEvent(new Event("storage")); // Notify other components
      }

      await updateCell({
        cellId: grid.id,
        waterLevel: newWaterLevel,
        moistureLevel: newMoistureLevel,
        cropCount: grid.cropCount,
      });

      router.refresh();

      toast("Prediction", {
        description: message,
        classNames: {
          toast: "!border-[#15803d] !py-0  !bg-white",
          title: "!text-lg !text-[#166534] !font-semibold !pt-2",
          description: "!text-[#15803d] !text-justify !pb-3",
        },
        duration: 15000,
      });
    } catch (error) {
      console.error("Error:", error);
      toast("Experiment Failed", {
        description: "Something went wrong!",
        duration: 3000,
      });
    }
  };

  const buttonContent = (
    <Button className="pointer-events-auto m-1 cursor-none border-[1px] border-black bg-[url('/soil.png')] bg-contain sm:h-16 sm:w-16 md:h-[102px] md:w-[102px]">
      <span className={getEmojiSize(grid.growthStage)}>
        {grid.cropType === "rice"
          ? "🌾"
          : grid.cropType === "corn"
            ? "🌽"
            : grid.cropType === "sugarcane"
              ? "🎍"
              : ""}
      </span>
    </Button>
  );

  if (isExperimental && grid.cropType) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div>
            <ApplyParamsPopover
              selectedTool={selectedTool}
              cropType={grid.cropType}
              amount={amount}
              setAmount={setAmount}
              onApply={handleApply}
              trigger={buttonContent}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="z-0 rounded-md bg-white px-5 py-3 shadow-md">
          <CropDetails grid={grid} />
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent className="z-0 rounded-md bg-white px-5 py-3 shadow-md">
        <CropDetails grid={grid} />
      </TooltipContent>
    </Tooltip>
  );
};

interface PlaygroundCardProps {
  title: "Actual Playground" | "Experimental Playground";
  gridData: GridItem[];
}

export default function PlaygroundCard({
  title,
  gridData = [],
}: PlaygroundCardProps) {
  const getEmojiSize = (growthStage: string | undefined) => {
    switch (growthStage) {
      case "Seedling":
        return "text-xs";
      case "Vegetative":
        return "text-sm";
      case "Budding":
        return "text-base";
      case "Flowering":
        return "text-lg";
      case "Fruiting":
        return "text-xl";
      case "Mature":
        return "text-2xl";
      case "Harvested":
        return "text-3xl";
      default:
        return "text-base";
    }
  };

  const defaultGrid = Array.from({ length: 12 }).map((_, index) => ({
    id: `empty-${index}`,
    cropType: "",
    cropCount: 0,
    waterLevel: 0,
    moistureLevel: 0,
    growthStage: "Seedling",
    row: Math.floor(index / 4),
    column: index % 4,
    farmId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return (
    <div className="m-5">
      <Card className="border-[#15803d]">
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle className="font-semibold text-[#166534]">
              {title}
            </CardTitle>
            <CardDescription className="text-[#15803d]">
              {title === "Actual Playground"
                ? "Digital Twin of your farm"
                : "Where you can test on your farm"}
            </CardDescription>
          </div>
          <PixelHeatMap
            gridData={gridData.length > 0 ? gridData : defaultGrid}
          />
        </CardHeader>
        <CardContent>
          <Card className="bg-[url('/grass.png')] bg-contain">
            <TooltipProvider>
              <div className="z-0 m-1 grid grid-cols-4 grid-rows-3">
                {(gridData.length > 0 ? gridData : defaultGrid).map((grid) => (
                  <GridCell
                    key={grid.id}
                    grid={grid}
                    isExperimental={title === "Experimental Playground"}
                    getEmojiSize={getEmojiSize}
                  />
                ))}
              </div>
            </TooltipProvider>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
