-- CreateTable
CREATE TABLE "payment_conditions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "conditionValue" TEXT,
    "isMet" BOOLEAN NOT NULL DEFAULT false,
    "metAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_conditions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "escrow_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_escrow_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "price" REAL NOT NULL,
    "fee" REAL NOT NULL,
    "total" REAL NOT NULL,
    "useCourier" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "creatorId" TEXT NOT NULL,
    "creatorRole" TEXT NOT NULL,
    "counterpartyId" TEXT,
    "counterpartyRole" TEXT,
    "counterpartyName" TEXT,
    "shippingDetails" TEXT,
    "deliveryDetails" TEXT,
    "paymentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "expectedDeliveryTime" TEXT,
    "actualDeliveryTime" TEXT,
    "autoReleaseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReleaseConditions" TEXT,
    "autoReleaseDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "escrow_transactions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "escrow_transactions_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_escrow_transactions" ("actualDeliveryTime", "completedAt", "counterpartyId", "counterpartyName", "counterpartyRole", "createdAt", "creatorId", "creatorRole", "currency", "deliveredAt", "deliveryDetails", "description", "expectedDeliveryTime", "fee", "id", "paidAt", "paymentCompleted", "paymentMethod", "paymentReference", "price", "shippedAt", "shippingDetails", "status", "total", "updatedAt", "useCourier") SELECT "actualDeliveryTime", "completedAt", "counterpartyId", "counterpartyName", "counterpartyRole", "createdAt", "creatorId", "creatorRole", "currency", "deliveredAt", "deliveryDetails", "description", "expectedDeliveryTime", "fee", "id", "paidAt", "paymentCompleted", "paymentMethod", "paymentReference", "price", "shippedAt", "shippingDetails", "status", "total", "updatedAt", "useCourier" FROM "escrow_transactions";
DROP TABLE "escrow_transactions";
ALTER TABLE "new_escrow_transactions" RENAME TO "escrow_transactions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
