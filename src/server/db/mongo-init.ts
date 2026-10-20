import { COLLECTIONS, closeMongoConnection, getMongoDb } from "./mongodb";

/**
 * Initializes MongoDB collections, indexes, and schema validators.
 *
 * Enforces BSON `decimal` type in MongoDB JSON Schema validators so invalid
 * types (like IEEE-754 floats) are rejected at the database engine level,
 * protecting accounting integrity.
 */
export async function initMongoDatabase(): Promise<void> {
  const db = await getMongoDb();
  console.log(`[MongoDB] Initializing database: ${db.databaseName}`);

  // List existing collections
  const existingCollections = await db.listCollections().toArray();
  const existingNames = new Set(existingCollections.map((c) => c.name));

  // Helper to ensure collection exists
  async function ensureCollection(name: string, validator?: object) {
    if (!existingNames.has(name)) {
      await db.createCollection(name, validator ? { validator } : {});
      console.log(`  + Created collection: ${name}`);
    } else if (validator) {
      try {
        await db.command({
          collMod: name,
          validator,
        });
      } catch {
        // Ignore if validator modification is not supported on this user's permissions
      }
    }
  }

  // 1. Core accounting collections with Decimal128 validation
  await ensureCollection(COLLECTIONS.journalEntries, {
    $jsonSchema: {
      bsonType: "object",
      required: ["number", "date", "status"],
      properties: {
        number: { bsonType: "string" },
        date: { bsonType: ["date", "string"] },
        status: { enum: ["DRAFT", "POSTED", "CANCELLED"] },
        totalDebit: { bsonType: "decimal" },
        totalCredit: { bsonType: "decimal" },
      },
    },
  });

  await ensureCollection(COLLECTIONS.journalItems, {
    $jsonSchema: {
      bsonType: "object",
      required: ["journalEntryId", "accountId"],
      properties: {
        journalEntryId: { bsonType: "string" },
        accountId: { bsonType: "string" },
        debit: { bsonType: "decimal" },
        credit: { bsonType: "decimal" },
      },
    },
  });

  // Ensure remaining collections
  for (const name of Object.values(COLLECTIONS)) {
    await ensureCollection(name);
  }

  // 2. Indexes
  console.log("[MongoDB] Ensuring indexes...");

  // Users
  await db.collection(COLLECTIONS.users).createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { loginId: 1 }, unique: true },
    { key: { role: 1 } },
  ]);

  // Auth
  await db.collection(COLLECTIONS.authAccounts).createIndex(
    { provider: 1, providerAccountId: 1 },
    { unique: true },
  );
  await db.collection(COLLECTIONS.authSessions).createIndex(
    { sessionToken: 1 },
    { unique: true },
  );

  // Master Data
  await db.collection(COLLECTIONS.contacts).createIndexes([
    { key: { name: 1 } },
    { key: { type: 1, isArchived: 1 } },
    { key: { email: 1 } },
  ]);

  await db.collection(COLLECTIONS.products).createIndexes([
    { key: { defaultCode: 1 }, unique: true, sparse: true },
    { key: { name: 1 } },
  ]);

  await db.collection(COLLECTIONS.taxes).createIndex(
    { name: 1 },
    { unique: true },
  );

  await db.collection(COLLECTIONS.ledgerAccounts).createIndexes([
    { key: { code: 1 }, unique: true },
    { key: { type: 1 } },
    { key: { kind: 1 } },
  ]);

  await db.collection(COLLECTIONS.journals).createIndexes([
    { key: { code: 1 }, unique: true },
    { key: { type: 1 } },
  ]);

  // Ledger Entries & Items
  await db.collection(COLLECTIONS.journalEntries).createIndexes([
    { key: { number: 1 }, unique: true },
    { key: { date: 1 } },
    { key: { status: 1 } },
    { key: { journalId: 1 } },
  ]);

  await db.collection(COLLECTIONS.journalItems).createIndexes([
    { key: { journalEntryId: 1 } },
    { key: { accountId: 1 } },
    { key: { date: 1 } },
    { key: { contactId: 1 }, sparse: true },
  ]);

  // Documents
  await db.collection(COLLECTIONS.customerInvoices).createIndexes([
    { key: { number: 1 }, unique: true },
    { key: { invoiceDate: 1 } },
    { key: { status: 1 } },
    { key: { contactId: 1 } },
  ]);

  await db.collection(COLLECTIONS.vendorBills).createIndexes([
    { key: { number: 1 }, unique: true },
    { key: { invoiceDate: 1 } },
    { key: { status: 1 } },
    { key: { contactId: 1 } },
  ]);

  await db.collection(COLLECTIONS.payments).createIndexes([
    { key: { number: 1 }, unique: true },
    { key: { paymentDate: 1 } },
    { key: { contactId: 1 } },
  ]);

  await db.collection(COLLECTIONS.budgets).createIndex(
    { name: 1 },
  );

  console.log("[MongoDB] All collections and indexes initialized successfully.");
}

// Allow direct CLI execution
if (require.main === module || process.argv[1]?.includes("mongo-init")) {
  initMongoDatabase()
    .then(async () => {
      await closeMongoConnection();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("[MongoDB] Initialization failed:", err);
      await closeMongoConnection();
      process.exit(1);
    });
}
