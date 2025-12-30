-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "RouteLogStatus" AS ENUM ('ACTIVE', 'FINISHED', 'TRANSFERRED');

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "circulationPermitDate" TIMESTAMP(3) NOT NULL,
    "technicalReviewDate" TIMESTAMP(3) NOT NULL,
    "insuranceDate" TIMESTAMP(3) NOT NULL,
    "gasesReviewDate" TIMESTAMP(3) NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "activeRouteLogId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteLog" (
    "id" SERIAL NOT NULL,
    "driverName" TEXT NOT NULL,
    "startMileage" INTEGER NOT NULL,
    "endMileage" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notesStart" TEXT,
    "notesEnd" TEXT,
    "imagesStart" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imagesEnd" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "receiverName" TEXT,
    "receiverSignature" TEXT,
    "status" "RouteLogStatus" NOT NULL DEFAULT 'ACTIVE',
    "transferTo" TEXT,
    "vehicleId" INTEGER NOT NULL,

    CONSTRAINT "RouteLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_activeRouteLogId_key" ON "Vehicle"("activeRouteLogId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_activeRouteLogId_fkey" FOREIGN KEY ("activeRouteLogId") REFERENCES "RouteLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteLog" ADD CONSTRAINT "RouteLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
