import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

import { GrowthStage } from "@prisma/client";

export const playgroundRouter = createTRPCRouter({
  // Import CSV and push to database
  importCSV: publicProcedure
    .input(
      z.object({
        farmName: z.string().optional(),
        data: z.array(
          z.object({
            id: z.string(),
            cropType: z.string(),
            cropCount: z.number(),
            waterLevel: z.number(),
            moistureLevel: z.number(),
            growthStage: z.string(),
            row: z.number(),
            column: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      // Fetch existing farm names
      const existingFarms = await db.farm.findMany({
        select: { name: true },
      });

      // Extract numbers from farm names
      const farmNumbers = existingFarms
        .map((farm) => {
          if (!farm.name) return null;
          const match = /^Farm (\d+)$/.exec(farm.name);
          return match?.[1] ? parseInt(match[1], 10) : null;
        })
        .filter((num): num is number => num !== null)
        .sort((a, b) => a - b);

      // Determine next farm number
      let nextFarmNumber = 1;
      for (const num of farmNumbers) {
        if (num === nextFarmNumber) {
          nextFarmNumber++;
        } else {
          break;
        }
      }

      const newFarmName = `Farm ${nextFarmNumber}`;

      const newFarm = await db.farm.create({
        data: { name: newFarmName },
      });

      const farmId = newFarm.id;

      function mapGrowthStage(stage: string): GrowthStage {
        const enumValue = Object.values(GrowthStage).find(
          (s) => s.toLowerCase() === stage.toLowerCase(),
        );
        if (!enumValue) {
          throw new Error(`Invalid growth stage: ${stage}`);
        }
        return enumValue as GrowthStage;
      }

      await db.actualGrid.createMany({
        data: input.data.map((cell) => ({
          ...cell,
          farmId,
          growthStage: mapGrowthStage(cell.growthStage),
        })),
      });

      await db.experimentalGrid.createMany({
        data: input.data.map((cell) => ({
          ...cell,
          farmId,
          growthStage: mapGrowthStage(cell.growthStage),
        })),
      });

      return { success: true, farmId, farmName: newFarmName };
    }),

  // Fetch all farms
  getUserFarms: publicProcedure.query(async () => {
    return await db.farm.findMany({
      select: { id: true, name: true },
    });
  }),

  // Fetch actual playground data for a farm
  getActualGrid: publicProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ input }) => {
      return await db.actualGrid.findMany({
        where: { farmId: input.farmId },
      });
    }),

  // Fetch experimental playground data for a farm
  getExperimentalGrid: publicProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ input }) => {
      return await db.experimentalGrid.findMany({
        where: { farmId: input.farmId },
      });
    }),

  // Update an experimental grid cell (user applies changes)
  updateExperimentalCell: publicProcedure
    .input(
      z.object({
        cellId: z.string(), // Use this in `where`
        cropCount: z.number().optional(),
        waterLevel: z.number().optional(),
        moistureLevel: z.number().optional(),
        growthStage: z
          .enum([
            "Seedling",
            "Vegetative",
            "Budding",
            "Flowering",
            "Fruiting",
            "Mature",
            "Harvested",
          ])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.experimentalGrid.update({
        where: { id: input.cellId },
        data: {
          cropCount: input.cropCount,
          waterLevel: input.waterLevel,
          moistureLevel: input.moistureLevel,
          growthStage: input.growthStage,
        },
      });
    }),

  // Delete a farm
  deleteFarm: publicProcedure
    .input(z.object({ farmId: z.string() }))
    .mutation(async ({ input }) => {
      // Ensure the farm exists
      const farm = await db.farm.findFirst({
        where: { id: input.farmId },
      });
      if (!farm) {
        throw new Error("Farm not found.");
      }

      // Delete associated grid data first
      await db.actualGrid.deleteMany({ where: { farmId: input.farmId } });
      await db.experimentalGrid.deleteMany({ where: { farmId: input.farmId } });

      // Delete the farm
      await db.farm.delete({ where: { id: input.farmId } });

      return { success: true, message: "Farm deleted successfully." };
    }),

  // Reset experimental grid to match actual grid
  resetExperimentalGrid: publicProcedure
    .input(z.object({ farmId: z.string() }))
    .mutation(async ({ input }) => {
      // Delete existing experimental grid data
      await db.experimentalGrid.deleteMany({ where: { farmId: input.farmId } });

      // Copy actual grid data to experimental grid
      const actualGridData = await db.actualGrid.findMany({
        where: { farmId: input.farmId },
      });
      await db.experimentalGrid.createMany({
        data: actualGridData.map(({ farmId, ...rest }) => ({
          farmId,
          ...rest,
        })),
      });

      return {
        success: true,
        message: "Experimental grid reset successfully.",
      };
    }),
});
