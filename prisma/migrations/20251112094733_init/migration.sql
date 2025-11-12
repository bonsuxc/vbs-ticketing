-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Paid',
    "reference" TEXT,
    "ticketType" TEXT NOT NULL DEFAULT 'Regular',
    "ticketId" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL DEFAULT 'Dec 15, 2025',
    "eventTime" TEXT NOT NULL DEFAULT '09:00 AM',
    "accessCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_ticketId_key" ON "Payment"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_accessCode_key" ON "Payment"("accessCode");
