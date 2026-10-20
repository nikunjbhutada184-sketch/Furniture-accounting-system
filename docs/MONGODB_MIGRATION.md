# MongoDB Database Migration Guide

This guide details the database architecture and migration path for shifting the **Urban Furniture Accounting System** to **MongoDB** while maintaining strict double-entry accounting guarantees and exact monetary precision via BSON **`Decimal128`**.

---

## 1. Why BSON Decimal128?

Standard JavaScript numbers and MongoDB floats are IEEE 754 floating-point values. In financial and accounting systems, binary floats introduce catastrophic precision errors:

```ts
0.1 + 0.2 = 0.30000000000000004 // Breaks sum(debits) === sum(credits)
```

To satisfy **Guiding Principle #3** (*Money is Decimal, everywhere*):
* Financial amounts are stored natively as BSON **`Decimal128`** in MongoDB.
* The application layer (`src/server/money/index.ts`) coerces `Decimal128` to arbitrary-precision `Decimal.js` instances without passing through floating point numbers.
* JSON Schema validators at the collection level enforce `bsonType: "decimal"` on all monetary fields (`debit`, `credit`, `totalDebit`, `totalCredit`, `amountUntaxed`, `amountTax`, `amountTotal`, etc.).

---

## 2. Architecture Overview

### Connection Management (`src/server/db/mongodb.ts`)
* Implements a connection pool singleton cached on `globalThis` to prevent connection leaks during Next.js Hot Module Replacement (HMR) in development.
* Exports conversion utilities:
  - `toBsonDecimal(value: MoneyInput, scale?: number): Decimal128`
  - `fromBsonDecimal(value: unknown): Decimal`
* Defines standard collection names (`COLLECTIONS`).

### Multi-Document ACID Transactions
MongoDB supports multi-document transactions when running as a **replica set** (e.g. local `rs0` or MongoDB Atlas cluster):

```ts
import { withMongoTransaction } from "@/server/db/mongodb";

await withMongoTransaction(async (session, db) => {
  await db.collection("journal_entries").insertOne(entryDoc, { session });
  await db.collection("journal_items").insertMany(itemsDocs, { session });
});
```

### Schema & Index Initialization (`src/server/db/mongo-init.ts`)
Creates all collections and unique/sparse indexes, including:
* `users`: Unique indexes on `email` and `loginId`.
* `ledger_accounts`: Unique index on `code`.
* `journal_entries`: Unique index on `number`, plus indexes on `date` and `status`.
* `customer_invoices` & `vendor_bills`: Unique index on `number`.
* `taxes`: Unique index on `name`.
* Strict schema validation enforcing `bsonType: "decimal"` on entry debits and credits.

---

## 3. Step-by-Step Migration Guide

### Prerequisites
Ensure MongoDB is running as a **replica set** (required for multi-document ACID transactions).

#### Option A: Local MongoDB with Replica Set
If running MongoDB locally, start `mongod` with `--replSet`:
```bash
mongod --dbpath <data-dir> --replSet rs0
```
In `mongosh`, initiate the replica set once:
```javascript
rs.initiate()
```

#### Option B: MongoDB Atlas
Atlas clusters are automatically configured with replica sets. Use your connection string:
```env
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/urban_furniture?retryWrites=true&w=majority"
```

---

### Running the Migration

1. **Configure Environment Variables**:
   In `.env`, configure `MONGODB_URI`:
   ```env
   MONGODB_URI="mongodb://localhost:27017/urban_furniture?replicaSet=rs0"
   TEST_MONGODB_URI="mongodb://localhost:27017/urban_furniture_test?replicaSet=rs0"
   ```

2. **Initialize MongoDB Collections & Indexes**:
   ```bash
   npm run db:mongo:init
   ```

3. **Migrate Data from PostgreSQL to MongoDB**:
   ```bash
   npm run db:mongo:migrate
   ```
   This script:
   * Connects to PostgreSQL via Prisma.
   * Reads existing master data and accounting records.
   * Maps relational IDs to `_id`.
   * Automatically converts every `Prisma.Decimal` to a BSON `Decimal128` instance.
   * Performs idempotent bulk upserts into MongoDB.
