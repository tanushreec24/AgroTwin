import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const plotRouter = createTRPCRouter({
  createPlot: publicProcedure
    .input(z.object({
      farmId: z.string().cuid(),
      cropId: z.string().cuid().optional(),
      row: z.number().optional(),
      column: z.number().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      areaSqM: z.number().optional(),
      soilType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.plot.create({
        data: input,
      });
    }),

  getPlotById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.plot.findUnique({
        where: { id: input.id },
        include: { crop: true, farm: true, sensors: true, readings: true, actions: true, recommendations: true },
      });
    }),

  getAllPlots: publicProcedure.query(async () => {
    return prisma.plot.findMany({
      include: { crop: true, farm: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  getPlotsByFarm: publicProcedure
    .input(z.object({ farmId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.plot.findMany({
        where: { farmId: input.farmId },
        include: { crop: true },
      });
    }),

  getPlotsByCrop: publicProcedure
    .input(z.object({ cropId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.plot.findMany({
        where: { cropId: input.cropId },
        include: { farm: true },
      });
    }),

  updatePlot: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      farmId: z.string().cuid().optional(),
      cropId: z.string().cuid().optional(),
      row: z.number().optional(),
      column: z.number().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      areaSqM: z.number().optional(),
      soilType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.plot.update({
        where: { id },
        data,
      });
    }),

  deletePlot: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.plot.delete({
        where: { id: input.id },
      });
    }),
}); 