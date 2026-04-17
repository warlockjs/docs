# Cascade Next - Usage Guide

A powerful, type-safe ORM for MongoDB (with PostgreSQL support coming) featuring data synchronization, migrations, and comprehensive model lifecycle management.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Model Basics](#model-basics)
3. [CRUD Operations](#crud-operations)
4. [Query Builder](#query-builder)
5. [Model Events](#model-events)
6. [Data Synchronization](#data-synchronization)
7. [Migrations](#migrations)
8. [Transactions](#transactions)
9. [Advanced Usage](#advanced-usage)

---

## Getting Started

### Installation

```bash
npm install @warlock.js/cascade
```

### Configuration

```typescript
// src/config/database.ts
import { DataSource, dataSourceRegistry, MongoDbDriver } from "@warlock.js/cascade";

const dataSource = new DataSource({
  name: "default",
  driver: new MongoDbDriver({
    url: process.env.MONGO_URL || "mongodb://localhost:27017",
    database: "myapp",
  }),
});

dataSourceRegistry.set("default", dataSource);
```

### Connect to Database

```typescript
import type {
  ConnectionOptions,
  MongoDriverOptions,
  MongoClientOptions,
} from "@warlock.js/cascade";

// Connect at app startup
await connectToDatabase<MongoDriverOptions, MongoClientOptions>({
  driver: "mongodb",
  name: "default",
  database: "myapp",
  host: "localhost",
  port: 27017,

  // Driver-specific options (cascade-next)
  driverOptions: {
    autoGenerateId: true,
    counterCollection: "counters",
  },

  // Native MongoDB client options
  clientOptions: {
    minPoolSize: 5,
    maxPoolSize: 10,
  },

  // Model defaults
  modelOptions: {
    randomIncrement: true,
    initialId: 1000,
  },

  // Data source defaults
  defaultDeleteStrategy: "trash",
});

// Or use callback pattern
onceConnected(() => {
  console.log("Connected to MongoDB!");
});
```

---

## Model Basics

### Defining a Model

```typescript
import { Model } from "@warlock.js/cascade";
import { v } from "@warlock.js/seal";

class User extends Model {
  public static table = "users";
  public static primaryKey = "id";

  // Optional: validation schema
  public static schema = v.object({
    name: v.string().required(),
    email: v.string().email().required(),
    age: v.int().min(0).optional(),
  });
}
```

### Model Configuration Options

```typescript
class Product extends Model {
  public static table = "products";
  public static primaryKey = "id";

  // Auto-generate numeric IDs
  public static autoGenerateId = true;

  // Initial ID can be number or function
  public static initialId = 1000;
  // public static invalidId = () => Math.floor(Math.random() * 10000);

  // Increment step
  public static incrementIdBy = 1;
  // Use random increment step
  // public static randomIncrement = true; // Random 1-10
  // public static randomIncrement = () => Math.floor(Math.random() * 100);

  // Timestamps
  public static createdAtColumn = "createdAt";
  public static updatedAtColumn = "updatedAt";

  // Delete strategy: "permanent" | "soft" | "trash"
  public static deleteStrategy = "soft";
  public static deletedAtColumn = "deletedAt";

  // Data source (if not using default)
  public static dataSource = "custom";

  // Validation strict mode: "allow" | "strip" | "fail"
  public static strictMode = "strip";
}
```

---

## CRUD Operations

### Creating Records

```typescript
// Method 1: Create instance and save
const user = new User({
  name: "John Doe",
  email: "john@example.com",
});
await user.save();

console.log(user.id); // Auto-generated ID

// Method 2: Static create (coming soon)
// const user = await User.create({ name: "John", email: "john@example.com" });
```

### Reading Records

```typescript
// Find by ID
const user = await User.find(1);

// Find multiple by IDs
const users = await User.findMany([1, 2, 3]);

// First matching record
const admin = await User.first({ role: "admin" });

// All records
const allUsers = await User.all();

// With pagination
const page = await User.paginate({ page: 1, limit: 20 });
```

### Updating Records

```typescript
const user = await User.find(1);

// Update single field
user.set("name", "Jane Doe");

// Update multiple fields
user.merge({ name: "Jane Doe", age: 25 });

// Save changes
await user.save();

// Partial updates only send changed fields
```

### Deleting Records

```typescript
const user = await User.find(1);

// Based on deleteStrategy
await user.destroy();

// Force permanent delete
await user.destroy({ strategy: "permanent" });

// Soft delete (sets deletedAt)
await user.destroy({ strategy: "soft" });

// Move to trash collection
await user.destroy({ strategy: "trash" });
```

### Restoring Trashed Records

```typescript
// Restore from trash
await User.restore(userId);

// Restore all trashed users
await User.restoreAll();
```

---

## Query Builder

### Basic Queries

```typescript
// Simple where
const users = await User.query().where("status", "active").get();

// With operators
const adults = await User.query().where("age", ">=", 18).get();

// Multiple conditions
const result = await User.query().where("status", "active").where("role", "admin").get();
```

### Advanced Queries

```typescript
// OR conditions
const users = await User.query().where("role", "admin").orWhere("role", "moderator").get();

// Nested conditions
const users = await User.query()
  .where("status", "active")
  .where((query) => {
    query.where("role", "admin").orWhere("role", "moderator");
  })
  .get();

// IN clause
const users = await User.query().whereIn("id", [1, 2, 3]).get();

// NOT IN
const users = await User.query().whereNotIn("status", ["banned", "deleted"]).get();

// NULL checks
const unverified = await User.query().whereNull("verifiedAt").get();

// BETWEEN
const recentUsers = await User.query().whereBetween("createdAt", [startDate, endDate]).get();
```

### Selecting Fields

```typescript
// Select specific fields
const users = await User.query().select("name", "email").get();

// Exclude fields
const users = await User.query().except("password", "secret").get();
```

### Sorting and Pagination

```typescript
// Order by
const users = await User.query().orderBy("createdAt", "desc").get();

// Multiple sort
const users = await User.query().orderBy("lastName", "asc").orderBy("firstName", "asc").get();

// Limit and offset
const users = await User.query().limit(10).skip(20).get();

// Pagination helper
const page = await User.query().where("active", true).paginate({ page: 2, limit: 25 });
```

### Aggregations

```typescript
// Count
const count = await User.query().where("status", "active").count();

// Sum, Min, Max, Avg
const total = await Order.query().sum("amount");
const oldest = await User.query().min("createdAt");
const newest = await User.query().max("createdAt");
const avgAge = await User.query().avg("age");

// Group by
const stats = await Order.query().select("status").groupBy("status").get();
```

---

## Model Events

### Available Events

| Event        | When Triggered       |
| ------------ | -------------------- |
| `validating` | Before validation    |
| `validated`  | After validation     |
| `saving`     | Before insert/update |
| `saved`      | After insert/update  |
| `creating`   | Before insert        |
| `created`    | After insert         |
| `updating`   | Before update        |
| `updated`    | After update         |
| `deleting`   | Before delete        |
| `deleted`    | After delete         |

### Registering Event Listeners

```typescript
// Static method on model
User.events().onSaving((user) => {
  console.log("Saving user:", user.get("name"));
});

User.events().onCreated((user) => {
  // Send welcome email
  await sendWelcomeEmail(user.get("email"));
});

// Using on() method
User.on("saving", (user) => {
  user.set("slug", slugify(user.get("name")));
});
```

### Global Events

```typescript
import { globalModelEvents } from "@warlock.js/cascade";

// Listen to all models
globalModelEvents.onSaved((model) => {
  console.log(`${model.constructor.name} saved:`, model.id);
});
```

---

## Data Synchronization

The sync system keeps embedded data up-to-date across models automatically.

### Basic Setup

```typescript
// src/app/blog/events/sync.ts
import { modelSync } from "@warlock.js/cascade";
import { Category, Product, Tag, Post } from "../models";

export const cleanup = modelSync.register(() => {
  // When Category updates → update Product.category
  Category.sync(Product, "category");

  // When Tag updates → update Post.tags[i]
  Tag.syncMany(Post, "tags").identifyBy("id");
});
```

### Configuration Options

```typescript
export const cleanup = modelSync.register(() => {
  Category.sync(Product, "category")
    .embed("embedMinimal") // Custom embed method
    .watchFields(["name", "slug"]) // Only sync on these changes
    .maxDepth(2) // Limit chain depth
    .unsetOnDelete(); // Unset field on delete

  User.sync(Profile, "user").removeOnDelete(); // Delete profile when user deleted
});
```

### Custom Embed Methods

```typescript
class Category extends Model {
  // Default: includes all fields except _id
  public embedData() {
    const data = { ...this.data };
    delete data._id;
    return data;
  }

  // Minimal: only essential fields
  public embedMinimal() {
    return {
      id: this.get("id"),
      name: this.get("name"),
      slug: this.get("slug"),
    };
  }
}
```

### Multi-Level Sync

```typescript
// Category → Product → Module chain
export const cleanup = modelSync.register(() => {
  Category.sync(Product, "category").maxDepth(2);
  Product.syncMany(Module, "products").identifyBy("id");
});

// When Category updates:
// 1. Product.category updated (depth 1)
// 2. Module.products[i].category updated (depth 2)
```

---

## Migrations

### Creating a Migration

```typescript
import { Migration, Blueprint } from "@warlock.js/cascade";

export default class CreateUsersCollection extends Migration {
  public static name = "2024_01_15_create_users_collection";

  public async up(): Promise<void> {
    // Create collection and define schema
    this.create("users");

    // Data types
    this.integer("id").primary();
    this.string("name").index();
    this.string("email").unique();
    this.string("password");
    this.boolean("active").default(true);
    this.date("publishedAt").nullable();

    // Indexes
    this.geoIndex("location");
    this.unique(["email", "shopId"]); // Compound unique index

    // Timestamps (createdAt, updatedAt)
    this.timestamps();
  }

  public async down(): Promise<void> {
    this.drop("users");
  }
}
```

### Schema Operations

```typescript
// Add column
this.table("users");
this.string("phoneNumber").nullable();

// Drop column
this.table("users");
this.dropColumn("age");

// Create Index
this.table("products");
this.index("category");

// Create Table
this.create("orders");
this.id();
this.string("status");
```

### Running Migrations

```bash
# Run pending migrations
warlock migrate

# Rollback last batch
warlock migrate:rollback

# Fresh: drop all and re-run
warlock migrate:fresh

# Status
warlock migrate:status
```

---

## Transactions

```typescript
import { MongoDbDriver } from "@warlock.js/cascade";

const driver = dataSource.driver as MongoDbDriver;

// Start transaction (requires replica set)
const session = await driver.startSession();
session.startTransaction();

try {
  const user = new User({ name: "John" });
  await user.save();

  const order = new Order({ userId: user.id, total: 100 });
  await order.save();

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## Advanced Usage

### Using Different Data Sources

```typescript
class AnalyticsModel extends Model {
  public static dataSource = "analytics"; // Uses different connection
}
```

### Dirty Tracking

```typescript
const user = await User.find(1);

console.log(user.hasChanges()); // false

user.set("name", "New Name");

console.log(user.hasChanges()); // true
console.log(user.getDirtyColumns()); // ["name"]
console.log(user.getOriginal("name")); // "Old Name"

// Revert changes
user.resetChanges();
```

### Raw Driver Access

```typescript
const driver = User.getDataSource().driver;

// Raw MongoDB operations
const collection = driver.collection("users");
const result = await collection.findOne({ email: "test@example.com" });

// Aggregation pipeline
const pipeline = [
  { $match: { status: "active" } },
  { $group: { _id: "$role", count: { $sum: 1 } } },
];
const stats = await collection.aggregate(pipeline).toArray();
```

### Expressions

```typescript
import { now, concat, toDate } from "@warlock.js/cascade/expressions";

// Use expressions in queries
await User.query().where("expiresAt", "<", now()).update({ status: "expired" });
```

---

## Best Practices

1. **Define schemas** for validation on all models
2. **Use events** for side effects (emails, logging, etc.)
3. **Set appropriate sync depth** to prevent infinite loops
4. **Use transactions** for multi-document operations
5. **Implement custom embed methods** for performance
6. **Use query builder** instead of raw driver when possible
7. **Export cleanup functions** in event files for HMR

---

## TypeScript Support

All APIs are fully typed. Enable strict mode for best experience:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Model types are inferred from the schema:

```typescript
class User extends Model<{
  id: number;
  name: string;
  email: string;
  age?: number;
}> {
  // get() and set() are type-safe
}

const user = await User.find(1);
const name = user.get("name"); // string
const age = user.get("age"); // number | undefined
```
