import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient, SensorType } from "@prisma/client";

const prisma = new PrismaClient();

export const sensorRouter = createTRPCRouter({
  createSensor: publicProcedure
    .input(z.object({
      type: z.nativeEnum(SensorType),
      name: z.string().min(1, "Sensor name is required"),
      plotId: z.string().cuid().optional(),
      farmId: z.string().cuid().optional(),
      location: z.string().optional(),
      installedAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.sensor.create({
        data: input,
      });
    }),

  getSensorById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.sensor.findUnique({
        where: { id: input.id },
        include: { plot: true, farm: true, readings: true },
      });
    }),

  getAllSensors: publicProcedure.query(async () => {
    return prisma.sensor.findMany({
      include: { plot: true, farm: true },
      orderBy: { installedAt: "desc" },
    });
  }),

  getSensorsByPlot: publicProcedure
    .input(z.object({ plotId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.sensor.findMany({
        where: { plotId: input.plotId },
      });
    }),

  getSensorsByFarm: publicProcedure
    .input(z.object({ farmId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.sensor.findMany({
        where: { farmId: input.farmId },
      });
    }),

  updateSensor: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      type: z.nativeEnum(SensorType).optional(),
      name: z.string().optional(),
      plotId: z.string().cuid().optional(),
      farmId: z.string().cuid().optional(),
      location: z.string().optional(),
      installedAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.sensor.update({
        where: { id },
        data,
      });
    }),

  deleteSensor: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.sensor.delete({
        where: { id: input.id },
      });
    }),
}); 