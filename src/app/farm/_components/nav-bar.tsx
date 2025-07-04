"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";
import { Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import CsvUploader from "./csv-uploader";
import Loader from "./loader";

type Farm = {
  id: string;
  name: string;
};

export default function NavBar({
  farms,
  selectedFarmId,
}: {
  farms?: Farm[];
  selectedFarmId?: string;
}) {
  const router = useRouter();
  const [hoveredFarm, setHoveredFarm] = useState<string | null>(null);
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const deleteFarmMutation = api.playground.deleteFarm.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleFarmSelect = (farmId: string) => {
    if (farmId === selectedFarmId) return;

    setIsLoading(true);
    router.replace(`/farm?farmId=${farmId}`, { scroll: false });
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <>
      {isLoading && <Loader />}

      <div className="absolute right-4 top-4 flex gap-2 sm:right-9 sm:top-9">
        {/* Farm Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="pointer-events-auto cursor-none bg-[#15803d] text-sm sm:text-base">
              🌾 {farms?.find((f) => f.id === selectedFarmId)?.name ?? "Farm"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-0 border-[#15803d]">
            {farms && farms.length > 0 ? (
              farms.map((farm, index) => (
                <DropdownMenuItem
                  key={farm.id}
                  onMouseEnter={() => setHoveredFarm(farm.id)}
                  onMouseLeave={() => setHoveredFarm(null)}
                  className="pointer-events-auto flex cursor-none items-center justify-between"
                >
                  <span
                    onClick={() => handleFarmSelect(farm.id)}
                    className="pointer-events-auto flex-1 cursor-none"
                  >
                    {["🌿", "🌾", "🍀", "🌻", "🌴"][index % 5]} {farm.name}
                  </span>
                  {hoveredFarm === farm.id && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="pointer-events-auto ml-2 cursor-none text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFarmToDelete(farm);
                          }}
                        >
                          <Trash size={16} />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="pointer-events-auto z-40 cursor-none">
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete {farmToDelete?.name}
                            ? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setFarmToDelete(null)}
                            className="pointer-events-auto cursor-none"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              deleteFarmMutation.mutate({ farmId: farm.id })
                            }
                            className="pointer-events-auto cursor-none"
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="text-gray-500">
                No farms available
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <CsvUploader />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Main Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="pointer-events-auto cursor-none bg-[#15803d] text-sm sm:text-base">
              ☰ Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-0 border-[#15803d]">
            <DropdownMenuItem className="pointer-events-auto cursor-none">
              <Link href={"/"} className="pointer-events-auto cursor-none">
                🏠 Home
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
