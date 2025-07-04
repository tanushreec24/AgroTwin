import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const farmRouter = createTRPCRouter({
  // Create a new farm
  createFarm: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Farm name is required"),
    }))
    .mutation(async ({ input }) => {
      return prisma.farm.create({
        data: {
          name: input.name,
        },
      });
    }),

  // Get a farm by ID
  getFarmById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.farm.findUnique({
        where: { id: input.id },
        include: {
          plots: {
            include: {
              crop: true,
              sensors: true,
            },
          },
          sensors: true,
        },
      });
    }),

  // Get all farms
  getAllFarms: publicProcedure.query(async () => {
    return prisma.farm.findMany({
      include: {
        plots: {
          include: {
            sensors: true,
            crop: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Update a farm
  updateFarm: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1, "Farm name is required"),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.farm.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  // Delete a farm
  deleteFarm: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.farm.delete({
        where: { id: input.id },
      });
    }),
}); 