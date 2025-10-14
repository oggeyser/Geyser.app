/*
  Warnings:

  - You are about to drop the column `brand` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `plateNumber` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Vehicle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[patente]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `patente` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permisoCirculacion` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revisionGases` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revisionTecnica` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seguroObligatorio` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Vehicle_plateNumber_key";

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "brand",
DROP COLUMN "model",
DROP COLUMN "plateNumber",
DROP COLUMN "year",
ADD COLUMN     "patente" TEXT NOT NULL,
ADD COLUMN     "permisoCirculacion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "revisionGases" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "revisionTecnica" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "seguroObligatorio" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_patente_key" ON "Vehicle"("patente");
