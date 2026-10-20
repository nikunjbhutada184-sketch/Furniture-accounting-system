import { Prisma, PrismaClient } from "@prisma/client";
import { COLLECTIONS, closeMongoConnection, getMongoDb, toBsonDecimal } from "../src/server/db/mongodb";
import { initMongoDatabase } from "../src/server/db/mongo-init";

const prisma = new PrismaClient();

/**
 * Recursively converts all Prisma.Decimal values in an object to BSON Decimal128
 * and maps `id` to `_id`.
 */
function transformRecord<T extends Record<string, any>>(record: T): Record<string, any> {
  const result: Record<string, any> = { ...record };

  if ("id" in result) {
    result._id = result.id;
  }

  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Prisma.Decimal) {
      result[key] = toBsonDecimal(value.toString());
    } else if (value instanceof Date) {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object" ? transformRecord(item) : item,
      );
    } else if (value && typeof value === "object" && !(value instanceof RegExp)) {
      result[key] = transformRecord(value);
    }
  }

  return result;
}

async function migrateCollection<T extends Record<string, any>>(
  collectionName: string,
  fetchFn: () => Promise<T[]>,
): Promise<number> {
  const db = await getMongoDb();
  const records = await fetchFn();
  if (records.length === 0) {
    console.log(`  - ${collectionName}: 0 records`);
    return 0;
  }

  const collection = db.collection(collectionName);
  const docs = records.map(transformRecord);

  // Bulk upsert to make migration idempotent
  const operations = docs.map((doc) => ({
    replaceOne: {
      filter: { _id: doc._id },
      replacement: doc,
      upsert: true,
    },
  }));

  await collection.bulkWrite(operations);
  console.log(`  ✓ ${collectionName}: migrated ${docs.length} records`);
  return docs.length;
}

export async function runMigration(): Promise<void> {
  console.log("=========================================================");
  console.log("Urban Furniture — Shifting Database to MongoDB (Decimal128)");
  console.log("=========================================================\n");

  try {
    // 1. Initialize collections and indexes
    await initMongoDatabase();

    console.log("\n[Migration] Migrating data from PostgreSQL to MongoDB...");

    let total = 0;
    total += await migrateCollection(COLLECTIONS.users, () => prisma.user.findMany());
    total += await migrateCollection(COLLECTIONS.authAccounts, () => prisma.account.findMany());
    total += await migrateCollection(COLLECTIONS.authSessions, () => prisma.session.findMany());
    total += await migrateCollection(COLLECTIONS.authVerificationTokens, () => prisma.verificationToken.findMany());
    total += await migrateCollection(COLLECTIONS.companySettings, () => prisma.companySettings.findMany());
    total += await migrateCollection(COLLECTIONS.contacts, () => prisma.contact.findMany());
    total += await migrateCollection(COLLECTIONS.productCategories, () => prisma.productCategory.findMany());
    total += await migrateCollection(COLLECTIONS.products, () => prisma.product.findMany());
    total += await migrateCollection(COLLECTIONS.taxes, () => prisma.tax.findMany());
    total += await migrateCollection(COLLECTIONS.ledgerAccounts, () => prisma.ledgerAccount.findMany());
    total += await migrateCollection(COLLECTIONS.journals, () => prisma.journal.findMany());
    total += await migrateCollection(COLLECTIONS.journalEntries, () => prisma.journalEntry.findMany());
    total += await migrateCollection(COLLECTIONS.journalItems, () => prisma.journalItem.findMany());
    total += await migrateCollection(COLLECTIONS.sequences, () => prisma.sequence.findMany());
    total += await migrateCollection(COLLECTIONS.purchaseOrders, () => prisma.purchaseOrder.findMany());
    total += await migrateCollection(COLLECTIONS.purchaseOrderLines, () => prisma.purchaseOrderLine.findMany());
    total += await migrateCollection(COLLECTIONS.vendorBills, () => prisma.vendorBill.findMany());
    total += await migrateCollection(COLLECTIONS.vendorBillLines, () => prisma.vendorBillLine.findMany());
    total += await migrateCollection(COLLECTIONS.salesOrders, () => prisma.salesOrder.findMany());
    total += await migrateCollection(COLLECTIONS.salesOrderLines, () => prisma.salesOrderLine.findMany());
    total += await migrateCollection(COLLECTIONS.customerInvoices, () => prisma.customerInvoice.findMany());
    total += await migrateCollection(COLLECTIONS.customerInvoiceLines, () => prisma.customerInvoiceLine.findMany());
    total += await migrateCollection(COLLECTIONS.payments, () => prisma.payment.findMany());
    total += await migrateCollection(COLLECTIONS.paymentAllocations, () => prisma.paymentAllocation.findMany());
    total += await migrateCollection(COLLECTIONS.stockMoves, () => prisma.stockMove.findMany());
    total += await migrateCollection(COLLECTIONS.budgets, () => prisma.budget.findMany());
    total += await migrateCollection(COLLECTIONS.budgetLines, () => prisma.budgetLine.findMany());
    total += await migrateCollection(COLLECTIONS.analyticAccounts, () => prisma.analyticAccount.findMany());
    total += await migrateCollection(COLLECTIONS.auditLogs, () => prisma.auditLog.findMany());

    console.log(`\n[Migration] Successfully completed migration of ${total} records!`);
  } catch (err) {
    console.error("\n[Migration] Error during migration:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
    await closeMongoConnection();
  }
}

if (require.main === module || process.argv[1]?.includes("migrate-to-mongodb")) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
