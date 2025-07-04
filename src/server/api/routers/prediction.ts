import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db as prisma } from "~/server/db";
import { Parser } from 'json2csv';

// You may want to move this to an env variable
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000/api";

// declare module 'json2csv';

export const predictionRouter = createTRPCRouter({
  predictYield: publicProcedure
    .input(
      z.object({
        rainfall: z.number(),
        temperature: z.number(),
        soil_type: z.string(),
        plotId: z.string().cuid().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { plotId, ...mlInput } = input;
      const res = await fetch(`${ML_SERVICE_URL}/predict-yield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mlInput),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "Failed to get yield prediction");
      }
      const result = await res.json();
      // Store prediction in DB if plotId is provided
      if (plotId) {
        await prisma.prediction.create({
          data: {
            plotId,
            type: "yield",
            input: mlInput as any,
            result: result.prediction,
          },
        });
      }
      return result;
    }),

  predictIrrigation: publicProcedure
    .input(
      z.object({
        soil_moisture: z.number(),
        rainfall: z.number(),
        temperature: z.number(),
        plotId: z.string().cuid().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { plotId, ...mlInput } = input;
      const res = await fetch(`${ML_SERVICE_URL}/predict-irrigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mlInput),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "Failed to get irrigation prediction");
      }
      const result = await res.json();
      // Store prediction in DB if plotId is provided
      if (plotId) {
        await prisma.prediction.create({
          data: {
            plotId,
            type: "irrigation",
            input: mlInput as any,
            result: result.prediction,
          },
        });
      }
      return result;
    }),

  getPredictionsByPlot: publicProcedure
    .input(z.object({ plotId: z.string().cuid(), type: z.string().optional() }))
    .query(async ({ input }) => {
      return prisma.prediction.findMany({
        where: {
          plotId: input.plotId,
          ...(input.type ? { type: input.type } : {}),
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  exportPredictionsByPlot: publicProcedure
    .input(z.object({ plotId: z.string().cuid() }))
    .query(async ({ input }) => {
      const predictions = await prisma.prediction.findMany({
        where: { plotId: input.plotId },
        orderBy: { createdAt: 'asc' },
      });
      const fields = ['id', 'plotId', 'type', 'result', 'createdAt', 'input'];
      const parser = new Parser({ fields });
      const csv = parser.parse(predictions.map((p: any) => ({ ...p, input: JSON.stringify(p.input) })));
      return csv;
    }),

  exportPredictionsByFarm: publicProcedure
    .input(z.object({ farmId: z.string().cuid() }))
    .query(async ({ input }) => {
      // Get all plots for the farm
      const plots = await prisma.plot.findMany({ where: { farmId: input.farmId } });
      const plotIds = plots.map(p => p.id);
      const predictions = await prisma.prediction.findMany({
        where: { plotId: { in: plotIds } },
        orderBy: { createdAt: 'asc' },
      });
      const fields = ['id', 'plotId', 'type', 'result', 'createdAt', 'input'];
      const parser = new Parser({ fields });
      const csv = parser.parse(predictions.map((p: any) => ({ ...p, input: JSON.stringify(p.input) })));
      return csv;
    }),
}); 