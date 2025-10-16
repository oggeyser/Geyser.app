-- CreateTable
CREATE TABLE "RouteLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" INTEGER NOT NULL,
    "technicianName" TEXT NOT NULL,
    "kmStart" INTEGER NOT NULL,
    "kmEnd" INTEGER,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RouteLog" ADD CONSTRAINT "RouteLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
