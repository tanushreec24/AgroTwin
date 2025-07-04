import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "historical_uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

export const historicalRouter = createTRPCRouter({
  uploadHistoricalCSV: publicProcedure
    .input(z.object({ filename: z.string(), fileData: z.string() }))
    .mutation(async ({ input }) => {
      const { filename, fileData } = input;
      const filePath = path.join(UPLOAD_DIR, filename);
      const buffer = Buffer.from(fileData, "base64");
      fs.writeFileSync(filePath, buffer);
      return { filePath };
    }),
}); 