/*
  Warnings:

  - A unique constraint covering the columns `[name,state,district]` on the table `Farm` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "farmId" TEXT;

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "farmId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Farm_name_state_district_key" ON "Farm"("name", "state", "district");

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
