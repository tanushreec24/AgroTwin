import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sensorReadingRouter = createTRPCRouter({
  createSensorReading: publicProcedure
    .input(z.object({
      sensorId: z.string().cuid(),
      plotId: z.string().cuid().optional(),
      value: z.number(),
      timestamp: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.sensorReading.create({
        data: {
          ...input,
          timestamp: input.timestamp || new Date(),
        },
      });
    }),

  bulkCreateSensorReadings: publicProcedure
    .input(z.array(z.object({
      sensorId: z.string().cuid(),
      plotId: z.string().cuid().optional(),
      value: z.number(),
      timestamp: z.date().optional(),
    })))
    .mutation(async ({ input }) => {
      return prisma.sensorReading.createMany({
        data: input.map(r => ({
          ...r,
          timestamp: r.timestamp || new Date(),
        })),
      });
    }),

  getSensorReadingById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.sensorReading.findUnique({
        where: { id: input.id },
        include: { sensor: true, plot: true },
      });
    }),

  getReadingsBySensor: publicProcedure
    .input(z.object({ sensorId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.sensorReading.findMany({
        where: { sensorId: input.sensorId },
        orderBy: { timestamp: "desc" },
      });
    }),

  getReadingsByPlot: publicProcedure
    .input(z.object({ plotId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.sensorReading.findMany({
        where: { plotId: input.plotId },
        orderBy: { timestamp: "desc" },
      });
    }),

  getReadingsByTimeRange: publicProcedure
    .input(z.object({
      sensorId: z.string().cuid(),
      start: z.date(),
      end: z.date(),
    }))
    .query(async ({ input }) => {
      return prisma.sensorReading.findMany({
        where: {
          sensorId: input.sensorId,
          timestamp: {
            gte: input.start,
            lte: input.end,
          },
        },
        orderBy: { timestamp: "asc" },
      });
    }),

  deleteSensorReading: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.sensorReading.delete({
        where: { id: input.id },
      });
    }),

  // Get real-time simulated sensor readings (for demo/simulation)
  getLiveReadings: publicProcedure
    .input(z.object({
      farmId: z.string().optional(),
      plotId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const { farmId, plotId, limit } = input;
      
      // Get existing sensors to simulate readings for
      const sensors = await prisma.sensor.findMany({
        where: {
          plot: {
            farmId: farmId || undefined,
            id: plotId || undefined,
          },
        },
        include: {
          plot: {
            include: {
              farm: true,
              crop: true,
            },
          },
        },
        take: limit,
      });

      // Generate realistic simulated readings
      const simulatedReadings = sensors.map((sensor) => {
        const now = new Date();
        let value: number;
        let unit: string;

        // Generate realistic values based on sensor type
        switch (sensor.type) {
          case 'Temperature':
            value = 25 + Math.sin(now.getHours() / 24 * Math.PI) * 10 + (Math.random() - 0.5) * 5;
            unit = '°C';
            break;
          case 'Humidity':
            value = 60 + Math.sin(now.getHours() / 24 * Math.PI) * 20 + (Math.random() - 0.5) * 10;
            unit = '%';
            break;
          case 'SoilMoisture':
            value = 40 + Math.sin(now.getHours() / 24 * Math.PI) * 30 + (Math.random() - 0.5) * 15;
            unit = '%';
            break;
          case 'SoilN':
            value = 120 + (Math.random() - 0.5) * 40;
            unit = 'kg/ha';
            break;
          case 'SoilP':
            value = 25 + (Math.random() - 0.5) * 10;
            unit = 'kg/ha';
            break;
          case 'SoilK':
            value = 180 + (Math.random() - 0.5) * 60;
            unit = 'kg/ha';
            break;
          case 'Custom': // PH, Rainfall, etc.
            if (sensor.name.includes('PH')) {
              value = 6.5 + (Math.random() - 0.5) * 1;
              unit = 'pH';
            } else if (sensor.name.includes('Rainfall')) {
              value = Math.random() > 0.7 ? Math.random() * 5 : 0;
              unit = 'mm';
            } else {
              value = Math.random() * 100;
              unit = 'units';
            }
            break;
          default:
            value = Math.random() * 100;
            unit = 'units';
        }

        return {
          id: `sim_${sensor.id}_${now.getTime()}`,
          sensorId: sensor.id,
          plotId: sensor.plotId,
          value: Math.round(value * 100) / 100,
          unit,
          timestamp: now,
          sensor: {
            ...sensor,
            name: sensor.name,
            type: sensor.type,
          },
          plot: sensor.plot,
        };
      });

      return simulatedReadings;
    }),
}); 