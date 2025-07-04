"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface ApplyParamsPopoverProps {
  selectedTool: string | null;
  cropType: string;
  amount: number;
  setAmount: (val: number) => void;
  onApply: (amount: number, weather: string) => Promise<void>;
  trigger: React.ReactNode;
}

export function ApplyParamsPopover({
  selectedTool,
  cropType,
  amount,
  setAmount,
  onApply,
  trigger,
}: ApplyParamsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState("Sunny");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    setIsLoading(true);
    await onApply(amount, selectedWeather);
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={`z-0 rounded-md bg-white p-4 shadow-md ${selectedTool ? "block" : "hidden"}`}
      >
        <h3 className="mb-2 text-sm font-semibold text-green-800">
          Apply {selectedTool ?? "param"} to {cropType}
        </h3>

        {selectedTool === "weather" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="pointer-events-auto z-0 w-full cursor-none border-[#166534] text-[#166534]"
              >
                {selectedWeather ?? "Choose Weather"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="pointer-events-auto z-0 w-32 cursor-none">
              <DropdownMenuGroup>
                {["Sunny", "Rainy", "Windy", "Stormy", "Cloudy"].map(
                  (option) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => setSelectedWeather(option)}
                      className="pointer-events-auto z-0 cursor-none text-[#166534]"
                    >
                      {option}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Slider
              defaultValue={[amount]}
              max={100}
              step={1}
              onValueChange={(val) => setAmount(val[0] ?? 0)}
              onPointerDown={() =>
                document.body.classList.add("disable-magicui-pointer")
              }
              onPointerUp={() =>
                document.body.classList.remove("disable-magicui-pointer")
              }
            />

            <p className="pointer-events-auto cursor-none text-center text-green-800">
              {amount}{" "}
              {selectedTool === "water"
                ? "L"
                : selectedTool === "fertilizer"
                  ? "g"
                  : selectedTool === "pesticide"
                    ? "mL"
                    : ""}
            </p>
          </>
        )}

        <Button
          className="pointer-events-auto mt-2 w-full cursor-none bg-green-600 text-white"
          onClick={handleApply}
          disabled={isLoading}
        >
          {isLoading ? "Experimenting..." : "Experiment"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
