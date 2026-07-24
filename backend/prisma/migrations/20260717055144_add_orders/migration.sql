-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'RECEIVED', 'VERIFIED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "fulfilment" TEXT NOT NULL DEFAULT 'store-pickup',
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "variantColor" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "framePrice" DECIMAL(10,2) NOT NULL,
    "lensType" TEXT,
    "lensPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "prescriptionMode" TEXT NOT NULL DEFAULT 'manual',
    "selectedPower" TEXT,
    "prescriptionUrl" TEXT,
    "rightEyeSphere" TEXT,
    "rightEyeCylinder" TEXT,
    "rightEyeAxis" TEXT,
    "leftEyeSphere" TEXT,
    "leftEyeCylinder" TEXT,
    "leftEyeAxis" TEXT,
    "pdValue" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'upi',
    "utrNumber" TEXT,
    "paymentProofUrl" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "orders_phone_idx" ON "orders"("phone");
