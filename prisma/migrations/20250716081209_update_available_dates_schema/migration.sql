/*
  Warnings:

  - A unique constraint covering the columns `[date,startTime,endTime]` on the table `available_dates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endTime` to the `available_dates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `available_dates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "available_dates_date_timeSlot_key";

-- AlterTable
ALTER TABLE "available_dates" ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startTime" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mentorship_bookings" ADD COLUMN     "availableDateId" TEXT,
ADD COLUMN     "sessionEndTime" TEXT,
ADD COLUMN     "sessionStartTime" TEXT;

-- CreateIndex
CREATE INDEX "available_dates_date_idx" ON "available_dates"("date");

-- CreateIndex
CREATE INDEX "available_dates_isBooked_idx" ON "available_dates"("isBooked");

-- CreateIndex
CREATE INDEX "available_dates_dayOfWeek_idx" ON "available_dates"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "available_dates_date_startTime_endTime_key" ON "available_dates"("date", "startTime", "endTime");
