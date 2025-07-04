-- CreateEnum
CREATE TYPE "GrowthStage" AS ENUM ('Seedling', 'Vegetative', 'Budding', 'Flowering', 'Fruiting', 'Mature', 'Harvested');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('Temperature', 'Humidity', 'Rainfall', 'SolarRadiation', 'WindSpeed', 'WindDirection', 'SoilMoisture', 'SoilN', 'SoilP', 'SoilK', 'SoilPH', 'SoilEC', 'Chlorophyll', 'LeafAreaIndex', 'PestPresence', 'DiseasePresence', 'YieldEstimate', 'Custom');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('Irrigation', 'Fertilization', 'Pesticide', 'Planting', 'Harvesting', 'Tillage', 'Custom');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Executed');

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActualGrid" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "cropType" TEXT NOT NULL,
    "cropCount" INTEGER NOT NULL,
    "waterLevel" DOUBLE PRECISION NOT NULL,
    "moistureLevel" DOUBLE PRECISION NOT NULL,
    "growthStage" "GrowthStage" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActualGrid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentalGrid" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "cropType" TEXT,
    "cropCount" INTEGER,
    "waterLevel" DOUBLE PRECISION,
    "moistureLevel" DOUBLE PRECISION,
    "growthStage" "GrowthStage",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentalGrid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variety" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "cropId" TEXT,
    "row" INTEGER,
    "column" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "areaSqM" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "type" "SensorType" NOT NULL,
    "name" TEXT NOT NULL,
    "plotId" TEXT,
    "farmId" TEXT,
    "location" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "plotId" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "description" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "details" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActualGrid_farmId_row_column_key" ON "ActualGrid"("farmId", "row", "column");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentalGrid_farmId_row_column_key" ON "ExperimentalGrid"("farmId", "row", "column");

-- CreateIndex
CREATE INDEX "Plot_farmId_idx" ON "Plot"("farmId");

-- CreateIndex
CREATE INDEX "Sensor_plotId_idx" ON "Sensor"("plotId");

-- CreateIndex
CREATE INDEX "Sensor_farmId_idx" ON "Sensor"("farmId");

-- CreateIndex
CREATE INDEX "SensorReading_sensorId_idx" ON "SensorReading"("sensorId");

-- CreateIndex
CREATE INDEX "SensorReading_plotId_idx" ON "SensorReading"("plotId");

-- CreateIndex
CREATE INDEX "SensorReading_timestamp_idx" ON "SensorReading"("timestamp");

-- AddForeignKey
ALTER TABLE "ActualGrid" ADD CONSTRAINT "ActualGrid_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentalGrid" ADD CONSTRAINT "ExperimentalGrid_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
