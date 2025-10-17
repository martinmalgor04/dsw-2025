-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('CREATED', 'RESERVED', 'IN_TRANSIT', 'ARRIVED', 'IN_DISTRIBUTION', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('AIR', 'SEA', 'RAIL', 'ROAD');

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "deliveryStreet" TEXT NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "deliveryState" TEXT NOT NULL,
    "deliveryPostalCode" TEXT NOT NULL,
    "deliveryCountry" TEXT NOT NULL DEFAULT 'AR',
    "departureStreet" TEXT,
    "departureCity" TEXT,
    "departureState" TEXT,
    "departurePostalCode" TEXT,
    "departureCountry" TEXT NOT NULL DEFAULT 'AR',
    "status" "ShippingStatus" NOT NULL DEFAULT 'CREATED',
    "transportType" "TransportType" NOT NULL,
    "trackingNumber" TEXT,
    "carrierName" TEXT,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "estimatedDeliveryAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_products" (
    "id" TEXT NOT NULL,
    "shippingId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "shipping_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_logs" (
    "id" TEXT NOT NULL,
    "shippingId" TEXT NOT NULL,
    "status" "ShippingStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_methods" (
    "id" TEXT NOT NULL,
    "type" "TransportType" NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedDays" TEXT NOT NULL,
    "baseCostPerKm" DECIMAL(10,4) NOT NULL,
    "baseCostPerKg" DECIMAL(10,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_trackingNumber_key" ON "shipments"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transport_methods_type_key" ON "transport_methods"("type");

-- AddForeignKey
ALTER TABLE "shipping_products" ADD CONSTRAINT "shipping_products_shippingId_fkey" FOREIGN KEY ("shippingId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_logs" ADD CONSTRAINT "shipping_logs_shippingId_fkey" FOREIGN KEY ("shippingId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
