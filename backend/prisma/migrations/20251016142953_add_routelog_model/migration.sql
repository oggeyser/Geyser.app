/*
  Warnings:

  - You are about to drop the column `date` on the `RouteLog` table. All the data in the column will be lost.
  - You are about to drop the column `kmEnd` on the `RouteLog` table. All the data in the column will be lost.
  - You are about to drop the column `kmStart` on the `RouteLog` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `RouteLog` table. All the data in the column will be lost.
  - You are about to drop the column `technicianName` on the `RouteLog` table. All the data in the column will be lost.
  - Added the required column `destination` to the `RouteLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverName` to the `RouteLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `RouteLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RouteLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RouteLog" DROP COLUMN "date",
DROP COLUMN "kmEnd",
DROP COLUMN "kmStart",
DROP COLUMN "observations",
DROP COLUMN "technicianName",
ADD COLUMN     "destination" TEXT NOT NULL,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "driverName" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "origin" TEXT NOT NULL,
ADD COLUMN     "routeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
