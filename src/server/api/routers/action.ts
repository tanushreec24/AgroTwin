import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PrismaClient, ActionType } from "@prisma/client";

const prisma = new PrismaClient();

export const actionRouter = createTRPCRouter({
  createAction: publicProcedure
    .input(z.object({
      plotId: z.string().cuid(),
      type: z.nativeEnum(ActionType),
      description: z.string().optional(),
      performedBy: z.string().optional(),
      performedAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.action.create({
        data: {
          ...input,
          performedAt: input.performedAt || new Date(),
        },
      });
    }),

  getActionById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.action.findUnique({
        where: { id: input.id },
        include: { plot: true },
      });
    }),

  getActionsByPlot: publicProcedure
    .input(z.object({ plotId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.action.findMany({
        where: { plotId: input.plotId },
        orderBy: { performedAt: "desc" },
      });
    }),

  getAllActions: publicProcedure.query(async () => {
    return prisma.action.findMany({
      include: { plot: true },
      orderBy: { performedAt: "desc" },
    });
  }),

  updateAction: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      type: z.nativeEnum(ActionType).optional(),
      description: z.string().optional(),
      performedBy: z.string().optional(),
      performedAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.action.update({
        where: { id },
        data,
      });
    }),

  deleteAction: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return prisma.action.delete({
        where: { id: input.id },
      });
    }),
}); 