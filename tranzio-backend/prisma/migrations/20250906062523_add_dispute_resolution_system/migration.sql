/*
  Warnings:

  - Added the required column `disputeType` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `raisedAgainst` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `raisedBy` to the `disputes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "dispute_evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disputeId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "description" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispute_evidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dispute_evidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disputeId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dispute_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dispute_resolutions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disputeId" TEXT NOT NULL,
    "resolutionType" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "amount" REAL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptedBy" TEXT,
    "rejectedBy" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dispute_resolutions_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_disputes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "raisedAgainst" TEXT NOT NULL,
    "disputeType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "disputes_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "escrow_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "disputes_raisedBy_fkey" FOREIGN KEY ("raisedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "disputes_raisedAgainst_fkey" FOREIGN KEY ("raisedAgainst") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_disputes" ("createdAt", "description", "id", "reason", "resolution", "resolvedAt", "status", "transactionId", "updatedAt") SELECT "createdAt", "description", "id", "reason", "resolution", "resolvedAt", "status", "transactionId", "updatedAt" FROM "disputes";
DROP TABLE "disputes";
ALTER TABLE "new_disputes" RENAME TO "disputes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
