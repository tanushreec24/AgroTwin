import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cropRouter = createTRPCRouter({
  createCrop: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Crop name is required"),
      variety: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.crop.create({
        data: input,
      });
    }),

  getCropById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.crop.findUnique({
        where: { id: input.id },
        include: { plots: true },
      });
    }),

  getAllCrops: publicProcedure.query(async () => {
    return prisma.crop.findMany({
      include: { plots: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  updateCrop: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      name: z.string().min(1, "Crop name is required"),
      variety: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.crop.update({
        where: { id },
        data,
      });
    }),

  deleteCrop: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.crop.delete({
        where: { id: input.id },
      });
    }),
}); 