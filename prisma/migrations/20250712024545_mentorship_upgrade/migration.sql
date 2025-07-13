/*
  Warnings:

  - Added the required column `sessionType` to the `mentorship_bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('RECORDED', 'FACE_TO_FACE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'RECORDED_SESSION';
ALTER TYPE "TransactionType" ADD VALUE 'FACE_TO_FACE_SESSION';

-- AlterTable
ALTER TABLE "mentorship_bookings" ADD COLUMN     "dateChanged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meetingLink" TEXT,
ADD COLUMN     "originalSessionDate" TIMESTAMP(3),
ADD COLUMN     "sessionType" "SessionType" NOT NULL DEFAULT 'FACE_TO_FACE',
ADD COLUMN     "videoLink" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- Remove the default after adding the column
ALTER TABLE "mentorship_bookings" ALTER COLUMN "sessionType" DROP DEFAULT;

-- CreateTable
CREATE TABLE "available_dates" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "available_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "available_dates_date_timeSlot_key" ON "available_dates"("date", "timeSlot");
