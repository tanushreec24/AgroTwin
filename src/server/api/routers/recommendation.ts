import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient, ActionType, RecommendationStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const recommendationRouter = createTRPCRouter({
  createRecommendation: publicProcedure
    .input(z.object({
      plotId: z.string().cuid(),
      actionType: z.nativeEnum(ActionType),
      details: z.string(),
      status: z.nativeEnum(RecommendationStatus).optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.recommendation.create({
        data: {
          ...input,
          status: input.status || "Pending",
        },
      });
    }),

  getRecommendationById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.recommendation.findUnique({
        where: { id: input.id },
        include: { plot: true },
      });
    }),

  getRecommendationsByPlot: publicProcedure
    .input(z.object({ plotId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.recommendation.findMany({
        where: { plotId: input.plotId },
        orderBy: { createdAt: "desc" },
      });
    }),

  getAllRecommendations: publicProcedure.query(async () => {
    return prisma.recommendation.findMany({
      include: { plot: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  updateRecommendation: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      actionType: z.nativeEnum(ActionType).optional(),
      details: z.string().optional(),
      status: z.nativeEnum(RecommendationStatus).optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.recommendation.update({
        where: { id },
        data,
      });
    }),

  deleteRecommendation: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.recommendation.delete({
        where: { id: input.id },
      });
    }),
}); 