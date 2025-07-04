-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "result" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prediction_plotId_idx" ON "Prediction"("plotId");

-- CreateIndex
CREATE INDEX "Prediction_type_idx" ON "Prediction"("type");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
