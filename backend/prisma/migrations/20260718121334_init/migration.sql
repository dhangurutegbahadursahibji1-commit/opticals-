-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'REFUNDED');

-- AlterTable
ALTER TABLE "contact_enquiries" ADD COLUMN     "leftEyeAxis" TEXT,
ADD COLUMN     "leftEyeCylinder" TEXT,
ADD COLUMN     "leftEyeSphere" TEXT,
ADD COLUMN     "lensType" TEXT,
ADD COLUMN     "pdValue" TEXT,
ADD COLUMN     "prescriptionMode" TEXT,
ADD COLUMN     "prescriptionUrl" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "productSku" TEXT,
ADD COLUMN     "rightEyeAxis" TEXT,
ADD COLUMN     "rightEyeCylinder" TEXT,
ADD COLUMN     "rightEyeSphere" TEXT,
ADD COLUMN     "selectedPower" TEXT;

-- CreateTable
CREATE TABLE "order_timeline" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_returns" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_timeline_orderId_idx" ON "order_timeline"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_returns_orderId_key" ON "order_returns"("orderId");

-- CreateIndex
CREATE INDEX "order_returns_status_idx" ON "order_returns"("status");

-- AddForeignKey
ALTER TABLE "order_timeline" ADD CONSTRAINT "order_timeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
