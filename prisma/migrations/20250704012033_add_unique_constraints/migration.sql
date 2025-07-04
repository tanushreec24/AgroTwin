/*
  Warnings:

  - A unique constraint covering the columns `[plotId,type]` on the table `Action` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commonName]` on the table `Crop` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plotId,actionType]` on the table `Recommendation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plotId,type]` on the table `Sensor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Action_plotId_type_key" ON "Action"("plotId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_commonName_key" ON "Crop"("commonName");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_plotId_actionType_key" ON "Recommendation"("plotId", "actionType");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_plotId_type_key" ON "Sensor"("plotId", "type");
