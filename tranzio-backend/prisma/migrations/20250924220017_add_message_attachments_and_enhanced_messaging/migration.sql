/*
  Warnings:

  - Added the required column `updatedAt` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" DATETIME,
    "replyToId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "messages_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "escrow_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_messages" ("content", "createdAt", "id", "isRead", "senderId", "transactionId") SELECT "content", "createdAt", "id", "isRead", "senderId", "transactionId" FROM "messages";
DROP TABLE "messages";
ALTER TABLE "new_messages" RENAME TO "messages";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
