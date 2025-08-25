-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'OPERATOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."DroneStatus" AS ENUM ('AVAILABLE', 'DELIVERING', 'CHARGING', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MissionStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."Urgency" AS ENUM ('STANDARD', 'PRIORITY', 'URGENT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "battery" INTEGER NOT NULL DEFAULT 100,
    "status" "public"."DroneStatus" NOT NULL DEFAULT 'AVAILABLE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "homeLatitude" DOUBLE PRECISION NOT NULL,
    "homeLongitude" DOUBLE PRECISION NOT NULL,
    "lastMaintenance" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "operatorId" TEXT,

    CONSTRAINT "drones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "droneId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "pickupLatitude" DOUBLE PRECISION NOT NULL,
    "pickupLongitude" DOUBLE PRECISION NOT NULL,
    "deliveryLatitude" DOUBLE PRECISION NOT NULL,
    "deliveryLongitude" DOUBLE PRECISION NOT NULL,
    "packageWeight" DOUBLE PRECISION NOT NULL,
    "packageDescription" TEXT NOT NULL,
    "deliveryInstructions" TEXT,
    "urgency" "public"."Urgency" NOT NULL DEFAULT 'STANDARD',
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "trackingCode" TEXT NOT NULL,
    "totalDistance" DOUBLE PRECISION,
    "deliveryFee" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."missions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "droneId" TEXT NOT NULL,
    "status" "public"."MissionStatus" NOT NULL DEFAULT 'ASSIGNED',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "route" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "actualDuration" INTEGER,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drone_telemetry" (
    "id" TEXT NOT NULL,
    "droneId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "battery" INTEGER NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drone_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tracking_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "orders_trackingCode_key" ON "public"."orders"("trackingCode");

-- AddForeignKey
ALTER TABLE "public"."drones" ADD CONSTRAINT "drones_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "public"."drones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."missions" ADD CONSTRAINT "missions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."missions" ADD CONSTRAINT "missions_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "public"."drones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drone_telemetry" ADD CONSTRAINT "drone_telemetry_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "public"."drones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_events" ADD CONSTRAINT "tracking_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
