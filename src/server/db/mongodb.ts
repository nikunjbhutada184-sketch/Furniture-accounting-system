import {
  type ClientSession,
  type Db,
  Decimal128,
  MongoClient,
  type MongoClientOptions,
} from "mongodb";
import { type Decimal, type MoneyInput, toMoney } from "@/server/money";

/**
 * MongoDB client singleton and connection manager.
 *
 * Preserves connections across Next.js hot module reloads in development
 * by caching on `globalThis`.
 */
interface GlobalWithMongo {
  mongoClient?: MongoClient;
  mongoDb?: Db;
}

const globalForMongo = globalThis as unknown as GlobalWithMongo;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  "mongodb://localhost:27017/urban_furniture?replicaSet=rs0";

const DEFAULT_OPTIONS: MongoClientOptions = {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
};

/**
 * Returns the shared MongoClient instance.
 */
export function getMongoClient(): MongoClient {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(MONGODB_URI, DEFAULT_OPTIONS);
  }
  return globalForMongo.mongoClient;
}

/**
 * Returns the default Mongo database instance.
 */
export async function getMongoDb(dbName?: string): Promise<Db> {
  const client = getMongoClient();
  if (!globalForMongo.mongoDb || dbName) {
    const db = client.db(dbName);
    if (!dbName) {
      globalForMongo.mongoDb = db;
    }
    return db;
  }
  return globalForMongo.mongoDb;
}

/**
 * Disconnects the MongoDB client cleanly. Useful for scripts and test teardowns.
 */
export async function closeMongoConnection(): Promise<void> {
  if (globalForMongo.mongoClient) {
    await globalForMongo.mongoClient.close();
    globalForMongo.mongoClient = undefined;
    globalForMongo.mongoDb = undefined;
  }
}

// ===========================================================================
// DECIMAL128 BSON CONVERSIONS
// ===========================================================================
// Double-entry accounting requires exact arbitrary-precision decimals.
// MongoDB natively provides BSON Decimal128. These helpers bridge between
// MongoDB's Decimal128, Prisma.Decimal / Decimal.js, and string representations.
// ===========================================================================

/**
 * Converts any MoneyInput into a BSON Decimal128 for storage in MongoDB.
 * Never converts through JavaScript floating-point numbers.
 */
export function toBsonDecimal(value: MoneyInput, scale: number = 2): Decimal128 {
  if (value instanceof Decimal128) {
    return value;
  }
  // Coerce via our money helper to guarantee proper scale and exact representation
  const dec = toMoney(value);
  return Decimal128.fromString(dec.toFixed(scale));
}

/**
 * Converts a MongoDB Decimal128 (or string/number) into an application Decimal.
 */
export function fromBsonDecimal(value: unknown): Decimal {
  if (value === null || value === undefined) {
    return toMoney(0);
  }
  if (value instanceof Decimal128) {
    return toMoney(value.toString());
  }
  if (typeof value === "object" && "_bsontype" in value && (value as { _bsontype: string })._bsontype === "Decimal128") {
    return toMoney(String(value));
  }
  return toMoney(value as MoneyInput);
}

// ===========================================================================
// MULTI-DOCUMENT ACID TRANSACTIONS
// ===========================================================================
// MongoDB transactions require a replica set (or mongos in sharded clusters).
// This runs a function within a MongoDB session transaction.
// ===========================================================================

export interface TransactionOptions {
  maxCommitTimeMS?: number;
}

/**
 * Runs operations inside a MongoDB multi-document ACID transaction.
 * Automatically rolls back on error.
 */
export async function withMongoTransaction<T>(
  fn: (session: ClientSession, db: Db) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  const client = getMongoClient();
  const session = client.startSession();
  const db = await getMongoDb();

  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session, db);
    }, {
      maxCommitTimeMS: options?.maxCommitTimeMS ?? 15_000,
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

// ===========================================================================
// MONGODB COLLECTION NAMES
// ===========================================================================

export const COLLECTIONS = {
  users: "users",
  authAccounts: "auth_accounts",
  authSessions: "auth_sessions",
  authVerificationTokens: "auth_verification_tokens",
  companySettings: "company_settings",
  contacts: "contacts",
  productCategories: "product_categories",
  products: "products",
  taxes: "taxes",
  ledgerAccounts: "ledger_accounts",
  journals: "journals",
  journalEntries: "journal_entries",
  journalItems: "journal_items",
  sequences: "sequences",
  purchaseOrders: "purchase_orders",
  purchaseOrderLines: "purchase_order_lines",
  vendorBills: "vendor_bills",
  vendorBillLines: "vendor_bill_lines",
  salesOrders: "sales_orders",
  salesOrderLines: "sales_order_lines",
  customerInvoices: "customer_invoices",
  customerInvoiceLines: "customer_invoice_lines",
  payments: "payments",
  paymentAllocations: "payment_allocations",
  stockMoves: "stock_moves",
  budgets: "budgets",
  budgetLines: "budget_lines",
  analyticAccounts: "analytic_accounts",
  auditLogs: "audit_logs",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
