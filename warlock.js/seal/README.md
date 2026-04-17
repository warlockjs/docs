# 🔮 Warlock Seal

> Cast validation seals on your schemas to protect your data

A powerful, type-safe validation library for TypeScript with an intuitive API and framework-agnostic design.

## 📦 Installation

```bash
npm install @warlock.js/seal
```

```bash
yarn add @warlock.js/seal
```

```bash
pnpm add @warlock.js/seal
```

## 🚀 Quick Start

```typescript
import { v, type Infer } from "@warlock.js/seal";

// Define your validation schema (cast a seal)
const userSeal = v.object({
  name: v.string().required().min(3),
  email: v.string().email().required(),
  age: v.int().min(18),
  status: v.string().in(["active", "inactive"]),
});

// Extract TypeScript type automatically
type User = Infer<typeof userSeal>;
// Result: { name: string; email: string; age: number; status: string }

// Validate data
const result = await v.validate(userSeal, userData);

if (result.isValid) {
  console.log("Data is sealed! ✅", result.data);
} else {
  console.log("Seal broken! ❌", result.errors);
  // [
  //   { error: "The name must be at least 3 characters", path: "name" },
  //   { error: "The email must be a valid email address", path: "email" }
  // ]
}
```

## 🎯 Core Concepts

### Three-Layer Validation Pipeline

Seal uses a unique **three-layer architecture** that separates concerns:

```
Input Data
    ↓
🔧 MUTATORS (Prep for Validation)
    - Normalize data before validation
    - Examples: trim(), lowercase(), toStartOfDay()
    - Run BEFORE validation rules
    ↓
✅ VALIDATORS (Check Constraints)
    - Validate against rules
    - Examples: email(), min(), after()
    - Return errors if validation fails
    ↓
🎨 TRANSFORMERS (Format Output)
    - Format validated data for output
    - Examples: toISOString(), toFormat()
    - Run AFTER validation passes
    ↓
Output Data
```

### Example: Date Validation

```typescript
const schema = v
  .date()
  .toStartOfDay() // 🔧 Mutator: normalize to 00:00:00
  .after("2024-01-01") // ✅ Validator: check Date object
  .toISOString(); // 🎨 Transformer: output as ISO string

const result = await v.validate(schema, "2024-06-15 14:30:00");
// result.data = "2024-06-15T00:00:00.000Z"
```

**Why this matters:**

- Mutators prepare data for validation (no more string comparison issues!)
- Validators check constraints on normalized data
- Transformers format output without affecting validation

---

## 🌟 Key Features

### ✅ Type Inference

Automatically extract TypeScript types from your schemas:

```typescript
const schema = v.object({
  name: v.string().required(),
  age: v.int(),
  tags: v.array(v.string()),
});

type User = Infer<typeof schema>;
// { name: string; age: number; tags: string[] }
```

### ✅ Intuitive API

Readable, chainable methods:

```typescript
v.string().required().email().min(5).max(100);

v.int().min(0).max(100).positive();

v.array(v.string()).minLength(1).unique();
```

### ✅ Conditional Validation

Apply different validators based on other field values:

```typescript
const schema = v.object({
  type: v.string().required().in(["admin", "user"]),
  role: v.string().when("type", {
    is: {
      admin: v.string().required().in(["super", "moderator"]),
      user: v.string().required().in(["member", "guest"]),
    },
  }),
});

// If type is "admin", role must be "super" or "moderator"
// If type is "user", role must be "member" or "guest"
```

### ✅ Field Comparison

Compare fields against each other (global or sibling scope):

```typescript
const schema = v.object({
  password: v.string().required().min(8),
  confirmPassword: v.string().required().sameAs("password"), // Compare with password field

  startDate: v.date().required(),
  endDate: v.date().required().after("startDate"), // Compare with startDate field
});
```

### ✅ Custom Validation

Add your own validation logic:

```typescript
v.string().refine(async value => {
  const exists = await checkUsername(value);
  if (exists) return "Username already taken";
});
```

### ✅ Mutators & Transformers

Normalize input and format output:

```typescript
// String mutators
v.string()
  .trim() // Remove whitespace
  .lowercase() // Convert to lowercase
  .email() // Validate email
  .toJSON(); // Transform to JSON string

// Date mutators & transformers
v.date()
  .toStartOfDay() // Normalize to midnight
  .after("2024-01-01")
  .toISOString(); // Output as ISO string
```

---

## 📚 Documentation

For complete documentation, visit: **[https://warlock.js.org/seal](https://warlock.js.org/seal)**

### Available Validators

| Validator     | Purpose            | Example                          |
| ------------- | ------------------ | -------------------------------- |
| `v.string()`  | String validation  | `v.string().email().min(3)`      |
| `v.int()`     | Integer validation | `v.int().min(0).max(100)`        |
| `v.float()`   | Float validation   | `v.float().positive()`           |
| `v.number()`  | Number validation  | `v.number().min(0)`              |
| `v.boolean()` | Boolean validation | `v.boolean().accepted()`         |
| `v.date()`    | Date validation    | `v.date().after(new Date())`     |
| `v.array()`   | Array validation   | `v.array(v.string()).min(1)`     |
| `v.object()`  | Object validation  | `v.object({ name: v.string() })` |
| `v.scalar()`  | Scalar values      | `v.scalar().in([1, "2", true])`  |

### Common Methods

Available on all validators:

| Method                     | Purpose                          |
| -------------------------- | -------------------------------- |
| `.required()`              | Value must be present            |
| `.optional()`              | Value is optional                |
| `.forbidden()`             | Value must not be present        |
| `.equals(value)`           | Must equal specific value        |
| `.default(value)`          | Set default value                |
| `.allowsEmpty()`           | Skip validation if empty         |
| `.when(field, conditions)` | Conditional validation           |
| `.omit()`                  | Validate but exclude from output |
| `.refine(callback)`        | Custom validation logic          |

---

## 💡 Examples

### User Registration

```typescript
const registerSchema = v.object({
  email: v.string().required().email(),
  password: v.string().required().min(8).strongPassword(),
  confirmPassword: v.string().required().sameAs("password"),
  age: v.int().required().min(18).max(120),
  terms: v.boolean().required().accepted(),
});
```

### Form with Conditional Fields

```typescript
const formSchema = v.object({
  accountType: v.string().required().in(["personal", "business"]),

  // Required only if accountType is "business"
  companyName: v.string().requiredIf("accountType", { is: "business" }),

  // Conditional validation
  taxId: v.string().when("accountType", {
    is: {
      business: v
        .string()
        .required()
        .pattern(/^[0-9]{9}$/),
      personal: v.string().forbidden(),
    },
  }),
});
```

### Date Range Validation

```typescript
const bookingSchema = v.object({
  checkIn: v.date().required().afterToday(),

  checkOut: v
    .date()
    .required()
    .after("checkIn") // Compare with checkIn field
    .withinDays(30), // Max 30 days from checkIn
});
```

### Array Validation

```typescript
const tagsSchema = v
  .array(v.string())
  .required()
  .minLength(1)
  .maxLength(10)
  .unique();

const usersSchema = v
  .array(
    v.object({
      name: v.string().required(),
      email: v.string().email(),
    })
  )
  .minLength(1);
```

---

## 🔧 Framework Extensions

For Warlock.js projects, framework-specific validators are available:

```typescript
import { v } from "@warlock.js/core/v";

const schema = v.object({
  email: v.string().email().unique(User), // Database validation
  avatar: v.file().image().maxSize(5000000), // File upload validation
  uploadId: v.string().uploadable(), // Upload hash validation
});
```

---

## 🎨 Why "Seal"?

🔮 **Magical Context**  
Warlocks use seals to protect and verify. Your validation schemas are seals that protect your data integrity.

💻 **Programming Context**  
A "seal of approval" - data that passes validation is sealed and verified.

✨ **Developer Experience**  
Clean, intuitive API that feels natural:

```typescript
const seal = v.object({ ... });  // Cast a seal
await v.validate(seal, data);     // Verify with the seal
```

---

## 🤝 Philosophy

**Seal** is designed around three principles:

1. **Type Safety First** - TypeScript support is not an afterthought
2. **Framework Agnostic** - Works anywhere JavaScript runs
3. **Intuitive API** - If it feels right, it probably works

---

## 📖 Full Documentation

For complete documentation, visit: **[https://warlock.js.org/seal](https://warlock.js.org/seal)**

The documentation includes:

- 📘 [Getting Started Guide](https://warlock.js.org/seal/getting-started/introduction)
- 🎯 [Core Concepts](https://warlock.js.org/seal/concepts/three-layer-architecture)
- 📝 [Validator Reference](https://warlock.js.org/seal/base-validator)
- 🔍 [All Validation Rules](https://warlock.js.org/seal/string-validator)
- 🔌 [Plugin System](https://warlock.js.org/seal/advanced/plugins)
- 🎨 [Custom Rules](https://warlock.js.org/seal/advanced/custom-rules)

---

## 📄 License

MIT

---

## 🤝 Contributing

See main Warlock.js repository

---

**Cast your seals and protect your data! 🔮✨**
