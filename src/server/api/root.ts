import { playgroundRouter } from "~/server/api/routers/playground";
import { createTRPCRouter } from "~/server/api/trpc";
import { farmRouter } from "~/server/api/routers/farm";
import { cropRouter } from "~/server/api/routers/crop";
import { plotRouter } from "~/server/api/routers/plot";
import { sensorRouter } from "~/server/api/routers/sensor";
import { sensorReadingRouter } from "~/server/api/routers/sensorReading";
import { actionRouter } from "~/server/api/routers/action";
import { recommendationRouter } from "~/server/api/routers/recommendation";
import { predictionRouter } from "~/server/api/routers/prediction";
import { historicalRouter } from "~/server/api/routers/historical";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  playground: playgroundRouter,
  farm: farmRouter,
  crop: cropRouter,
  plot: plotRouter,
  sensor: sensorRouter,
  sensorReading: sensorReadingRouter,
  action: actionRouter,
  recommendation: recommendationRouter,
  prediction: predictionRouter,
  historical: historicalRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
