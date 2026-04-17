# Seal Validation Library - Feature Comparison & Roadmap

This document compares Seal with major TypeScript/JavaScript validation libraries (Zod, Yup, Joi) and outlines potential features to implement.

## Legend

- ✅ **Implemented** - Feature is available in Seal
- 🔄 **Equivalent** - Seal has equivalent functionality with different naming
- ❌ **Not Implemented** - Feature is missing from Seal
- ⭐ **High Priority** - Recommended for next implementation
- 🔶 **Medium Priority** - Useful but not critical
- 🔵 **Low Priority** - Nice to have

---

## Schema Composition Methods

| Feature          | Zod              | Yup           | Joi           | Seal            | Status          | Priority  | Notes                       |
| ---------------- | ---------------- | ------------- | ------------- | --------------- | --------------- | --------- | --------------------------- |
| `.clone()`       | ❌               | `.clone()`    | `.clone()`    | ✅              | Implemented     | -         | Creates independent copy    |
| `.extend()`      | `.extend()`      | ❌            | ❌            | ✅              | Implemented     | -         | Add fields, keep config     |
| `.merge()`       | `.merge()`       | ❌            | ❌            | ✅              | Implemented     | -         | Combine schemas + configs   |
| `.pick()`        | `.pick()`        | `.pick()`     | `.fork()`     | ✅              | Implemented     | -         | Select specific fields      |
| `.omit()`        | `.omit()`        | `.omit()`     | `.fork()`     | ✅ `.without()` | Implemented     | -         | Exclude specific fields     |
| `.partial()`     | `.partial()`     | `.partial()`  | `.optional()` | ❌              | Not Implemented | ⭐ High   | Make all fields optional    |
| `.required()`    | `.required()`    | `.required()` | `.required()` | ❌              | Not Implemented | ⭐ High   | Make all fields required    |
| `.deepPartial()` | `.deepPartial()` | ❌            | ❌            | ❌              | Not Implemented | 🔶 Medium | Recursive partial           |
| `.keyof()`       | `.keyof()`       | ❌            | ❌            | ❌              | Not Implemented | 🔵 Low    | Extract schema keys as enum |

---

## Type Coercion & Transformation

| Feature         | Zod             | Yup            | Joi           | Seal            | Status          | Priority  | Notes                                         |
| --------------- | --------------- | -------------- | ------------- | --------------- | --------------- | --------- | --------------------------------------------- |
| Type coercion   | `.coerce()`     | `.transform()` | `.cast()`     | 🔄 Mutators     | Equivalent      | -         | Seal uses mutators (toString, toNumber, etc.) |
| Pre-processing  | `.preprocess()` | `.transform()` | ❌            | 🔄 Mutators     | Equivalent      | -         | Seal's mutators run before validation         |
| Post-processing | `.transform()`  | `.transform()` | ❌            | ✅ Transformers | Implemented     | -         | `addTransformer()`, `outputAs()`              |
| `.pipe()`       | `.pipe()`       | ❌             | ❌            | ❌              | Not Implemented | 🔶 Medium | Chain validators sequentially                 |
| `.catch()`      | `.catch()`      | ❌             | `.failover()` | ❌              | Not Implemented | 🔶 Medium | Default value on validation error             |
| `.default()`    | `.default()`    | `.default()`   | `.default()`  | ✅              | Implemented     | -         | Default when undefined                        |

---

## Nullability & Optionality

| Feature          | Zod              | Yup              | Joi              | Seal | Status          | Priority  | Notes                   |
| ---------------- | ---------------- | ---------------- | ---------------- | ---- | --------------- | --------- | ----------------------- |
| `.optional()`    | `.optional()`    | `.optional()`    | `.optional()`    | ✅   | Implemented     | -         | Allows undefined        |
| `.nullable()`    | `.nullable()`    | `.nullable()`    | `.allow(null)`   | ❌   | Not Implemented | ⭐ High   | Allow null values       |
| `.nullish()`     | `.nullish()`     | `.notRequired()` | ❌               | ❌   | Not Implemented | ⭐ High   | Allow null or undefined |
| `.nonNullable()` | `.nonNullable()` | `.nonNullable()` | `.invalid(null)` | ❌   | Not Implemented | 🔶 Medium | Disallow null           |

---

## Union & Alternative Types

| Feature             | Zod                    | Yup           | Joi              | Seal          | Status          | Priority | Notes                           |
| ------------------- | ---------------------- | ------------- | ---------------- | ------------- | --------------- | -------- | ------------------------------- |
| Union types         | `union()`              | `oneOfType()` | `alternatives()` | ✅ `union()`  | Implemented     | -        | Validate against multiple types |
| Discriminated union | `discriminatedUnion()` | ❌            | ❌               | ❌            | Not Implemented | ⭐ High  | Type-safe polymorphic unions    |
| Literal values      | `literal()`            | ❌            | `.valid()`       | 🔄 `.equal()` | Equivalent      | -        | Exact value matching            |

---

## Advanced Validators

| Feature        | Zod         | Yup       | Joi      | Seal              | Status          | Priority  | Notes                          |
| -------------- | ----------- | --------- | -------- | ----------------- | --------------- | --------- | ------------------------------ |
| Tuple          | `tuple()`   | `tuple()` | ❌       | ❌                | Not Implemented | 🔶 Medium | Fixed-length typed arrays      |
| Record/Map     | `record()`  | ❌        | ❌       | ❌                | Not Implemented | ⭐ High   | Dynamic keys with typed values |
| Set            | `set()`     | ❌        | ❌       | ❌                | Not Implemented | 🔵 Low    | Unique values collection       |
| Lazy/Recursive | `lazy()`    | `lazy()`  | `link()` | ❌                | Not Implemented | ⭐ High   | Self-referencing schemas       |
| Promise        | `promise()` | ❌        | ❌       | ❌                | Not Implemented | 🔵 Low    | Validate async values          |
| NaN            | `nan()`     | ❌        | ❌       | ❌                | Not Implemented | 🔵 Low    | Explicitly NaN                 |
| Never          | `never()`   | ❌        | ❌       | 🔄 `.forbidden()` | Equivalent      | -         | Value must not exist           |
| Unknown        | `unknown()` | ❌        | ❌       | ✅ `.any()`       | Implemented     | -         | Any value allowed              |
| Void           | `void()`    | ❌        | ❌       | ❌                | Not Implemented | 🔵 Low    | Only undefined                 |

---

## Object-Specific Features

| Feature       | Zod              | Yup                 | Joi                               | Seal                 | Status          | Priority  | Notes                         |
| ------------- | ---------------- | ------------------- | --------------------------------- | -------------------- | --------------- | --------- | ----------------------------- |
| Allow unknown | `.passthrough()` | `.noUnknown(false)` | `.unknown()`                      | ✅ `.allowUnknown()` | Implemented     | -         | Keep unknown keys             |
| Strip unknown | `.strip()`       | `.noUnknown()`      | `.options({stripUnknown})`        | ✅ `.stripUnknown()` | Implemented     | -         | Remove unknown keys           |
| Strict mode   | `.strict()`      | `.strict()`         | `.options({presence:'required'})` | 🔄 Default           | Equivalent      | -         | Reject unknown keys (default) |
| Catchall      | `.catchall()`    | ❌                  | ❌                                | ❌                   | Not Implemented | 🔶 Medium | Validator for unknown keys    |
| Set key       | `.setKey()`      | ❌                  | ❌                                | ❌                   | Not Implemented | 🔵 Low    | Dynamically add/remove keys   |
| `.allow()`    | ❌               | ❌                  | ❌                                | ✅ `.allow()`        | Implemented     | -         | Allow specific unknown keys   |

---

## Array-Specific Features

| Feature      | Zod           | Yup         | Joi         | Seal               | Status      | Priority | Notes                |
| ------------ | ------------- | ----------- | ----------- | ------------------ | ----------- | -------- | -------------------- |
| Min length   | `.min()`      | `.min()`    | `.min()`    | ✅ `.minLength()`  | Implemented | -        | Minimum array length |
| Max length   | `.max()`      | `.max()`    | `.max()`    | ✅ `.maxLength()`  | Implemented | -        | Maximum array length |
| Length       | `.length()`   | `.length()` | `.length()` | ✅ `.length()`     | Implemented | -        | Exact length         |
| Non-empty    | `.nonempty()` | `.min(1)`   | `.min(1)`   | 🔄 `.minLength(1)` | Equivalent  | -        | At least one item    |
| Unique items | ❌            | ❌          | `.unique()` | ✅ `.unique()`     | Implemented | -        | All items unique     |

---

## String-Specific Features

| Feature     | Zod              | Yup            | Joi            | Seal                        | Status          | Priority  | Notes                                |
| ----------- | ---------------- | -------------- | -------------- | --------------------------- | --------------- | --------- | ------------------------------------ |
| Email       | `.email()`       | `.email()`     | `.email()`     | ✅ `.email()`               | Implemented     | -         | Valid email                          |
| URL         | `.url()`         | `.url()`       | `.uri()`       | ✅ `.url()`                 | Implemented     | -         | Valid URL                            |
| UUID        | `.uuid()`        | `.uuid()`      | `.guid()`      | ❌                          | Not Implemented | ⭐ High   | UUID validation                      |
| CUID        | `.cuid()`        | ❌             | ❌             | ❌                          | Not Implemented | 🔵 Low    | CUID validation                      |
| ULID        | `.ulid()`        | ❌             | ❌             | ❌                          | Not Implemented | 🔵 Low    | ULID validation                      |
| Regex       | `.regex()`       | `.matches()`   | `.pattern()`   | ✅ `.pattern()`             | Implemented     | -         | Pattern matching                     |
| Starts with | `.startsWith()`  | ❌             | ❌             | ✅ `.startsWith()`          | Implemented     | -         | String prefix                        |
| Ends with   | `.endsWith()`    | ❌             | ❌             | ✅ `.endsWith()`            | Implemented     | -         | String suffix                        |
| Contains    | `.includes()`    | ❌             | ❌             | ✅ `.contains()`            | Implemented     | -         | Contains substring                   |
| Min length  | `.min()`         | `.min()`       | `.min()`       | ✅ `.min()`, `.minLength()` | Implemented     | -         | Minimum characters                   |
| Max length  | `.max()`         | `.max()`       | `.max()`       | ✅ `.max()`, `.maxLength()` | Implemented     | -         | Maximum characters                   |
| Length      | `.length()`      | `.length()`    | `.length()`    | ✅ `.length()`              | Implemented     | -         | Exact length                         |
| Trim        | `.trim()`        | `.trim()`      | `.trim()`      | ✅ `.trim()`                | Implemented     | -         | Remove whitespace                    |
| Lowercase   | `.toLowerCase()` | `.lowercase()` | `.lowercase()` | ✅ `.lowercase()`           | Implemented     | -         | Convert to lowercase                 |
| Uppercase   | `.toUpperCase()` | `.uppercase()` | `.uppercase()` | ✅ `.uppercase()`           | Implemented     | -         | Convert to uppercase                 |
| Datetime    | `.datetime()`    | ❌             | `.isoDate()`   | 🔄 DateValidator            | Equivalent      | -         | ISO date string                      |
| IP          | `.ip()`          | ❌             | `.ip()`        | ✅ `.ip()`                  | Implemented     | -         | IP address                           |
| Emoji       | `.emoji()`       | ❌             | ❌             | ❌                          | Not Implemented | 🔵 Low    | Emoji validation                     |
| Base64      | ❌               | ❌             | `.base64()`    | 🔄 Mutators                 | Equivalent      | -         | `.base64Encode()`, `.base64Decode()` |
| Domain      | ❌               | ❌             | `.domain()`    | ❌                          | Not Implemented | 🔶 Medium | Domain name validation               |
| JSON        | ❌               | ❌             | ❌             | ✅ `.toJSON()`              | Implemented     | -         | Output as JSON string                |

---

## Number-Specific Features

| Feature      | Zod              | Yup           | Joi           | Seal                         | Status          | Priority  | Notes                |
| ------------ | ---------------- | ------------- | ------------- | ---------------------------- | --------------- | --------- | -------------------- |
| Min          | `.min()`         | `.min()`      | `.min()`      | ✅ `.min()`                  | Implemented     | -         | Minimum value (>=)   |
| Max          | `.max()`         | `.max()`      | `.max()`      | ✅ `.max()`                  | Implemented     | -         | Maximum value (<=)   |
| Greater than | `.gt()`          | `.moreThan()` | `.greater()`  | ✅ `.greaterThan()`, `.gt()` | Implemented     | -         | Strict greater (>)   |
| Less than    | `.lt()`          | `.lessThan()` | `.less()`     | ✅ `.lessThan()`, `.lt()`    | Implemented     | -         | Strict less (<)      |
| Positive     | `.positive()`    | `.positive()` | `.positive()` | ✅ `.positive()`             | Implemented     | -         | > 0                  |
| Negative     | `.negative()`    | `.negative()` | `.negative()` | ✅ `.negative()`             | Implemented     | -         | < 0                  |
| Non-negative | `.nonnegative()` | ❌            | ❌            | 🔄 `.min(0)`                 | Equivalent      | -         | >= 0                 |
| Non-positive | `.nonpositive()` | ❌            | ❌            | 🔄 `.max(0)`                 | Equivalent      | -         | <= 0                 |
| Integer      | `.int()`         | `.integer()`  | `.integer()`  | ✅ `v.int()`                 | Implemented     | -         | Whole numbers only   |
| Finite       | `.finite()`      | ❌            | ❌            | ❌                           | Not Implemented | 🔶 Medium | Not Infinity         |
| Safe integer | `.safe()`        | ❌            | ❌            | ❌                           | Not Implemented | 🔵 Low    | Number.isSafeInteger |
| Multiple of  | ❌               | ❌            | `.multiple()` | ✅ `.modulo()`               | Implemented     | -         | Divisible by value   |

---

## Date-Specific Features

| Feature        | Zod      | Yup      | Joi      | Seal                                         | Status      | Priority | Notes                  |
| -------------- | -------- | -------- | -------- | -------------------------------------------- | ----------- | -------- | ---------------------- |
| Min date       | `.min()` | `.min()` | `.min()` | ✅ `.min()`, `.after()`                      | Implemented | -        | After/equal date       |
| Max date       | `.max()` | `.max()` | `.max()` | ✅ `.max()`, `.before()`                     | Implemented | -        | Before/equal date      |
| ISO format     | ❌       | ❌       | `.iso()` | ✅ `.format()`                               | Implemented | -        | Date format validation |
| Future         | ❌       | ❌       | ❌       | ✅ `.future()`                               | Implemented | -        | After today            |
| Past           | ❌       | ❌       | ❌       | ✅ `.past()`                                 | Implemented | -        | Before today           |
| Age validation | ❌       | ❌       | ❌       | ✅ `.age()`, `.minAge()`, `.maxAge()`        | Implemented | -        | Age-based validation   |
| Weekday        | ❌       | ❌       | ❌       | ✅ `.weekDay()`, `.weekdays()`, `.weekend()` | Implemented | -        | Day of week validation |
| Business day   | ❌       | ❌       | ❌       | ✅ `.businessDay()`                          | Implemented | -        | Monday-Friday          |

---

## Conditional Validation

| Feature           | Zod | Yup       | Joi               | Seal                                           | Status      | Priority | Notes                          |
| ----------------- | --- | --------- | ----------------- | ---------------------------------------------- | ----------- | -------- | ------------------------------ |
| When/conditional  | ❌  | `.when()` | `.when()`         | ✅ `.when()`, `.whenSibling()`                 | Implemented | -        | Different rules based on field |
| Required if       | ❌  | `.when()` | `.when()`         | ✅ `.requiredIf()`, `.requiredIfSibling()`     | Implemented | -        | Extensive conditional presence |
| Required with     | ❌  | ❌        | `.and()`          | ✅ `.requiredWith()`, `.requiredWithSibling()` | Implemented | -        | Required with another field    |
| Dependent schemas | ❌  | ❌        | `.dependencies()` | ✅ Multiple methods                            | Implemented | -        | 50+ conditional validators     |

---

## Field Comparison

| Feature           | Zod | Yup                  | Joi               | Seal                                             | Status      | Priority | Notes                         |
| ----------------- | --- | -------------------- | ----------------- | ------------------------------------------------ | ----------- | -------- | ----------------------------- |
| Same as field     | ❌  | `.oneOf([ref()])`    | `.valid(ref())`   | ✅ `.sameAs()`, `.sameAsSibling()`               | Implemented | -        | Field equality                |
| Different from    | ❌  | `.notOneOf([ref()])` | `.invalid(ref())` | ✅ `.differentFrom()`, `.differentFromSibling()` | Implemented | -        | Field inequality              |
| Date comparison   | ❌  | ❌                   | ❌                | ✅ `.before()`, `.after()` + siblings            | Implemented | -        | Smart date field comparison   |
| Number comparison | ❌  | ❌                   | ❌                | ✅ `.min()`, `.max()` + siblings                 | Implemented | -        | Smart number field comparison |

---

## Custom Validation

| Feature          | Zod              | Yup       | Joi         | Seal                         | Status          | Priority | Notes                        |
| ---------------- | ---------------- | --------- | ----------- | ---------------------------- | --------------- | -------- | ---------------------------- |
| Custom rule      | `.refine()`      | `.test()` | `.custom()` | ✅ `.refine()`, `.useRule()` | Implemented     | -        | Custom validation logic      |
| Super refine     | `.superRefine()` | ❌        | ❌          | ❌                           | Not Implemented | 🔵 Low   | Multiple custom errors       |
| Async validation | ✅               | ✅        | ✅          | ✅                           | Implemented     | -        | All validators support async |

---

## Metadata & Utilities

| Feature            | Zod           | Yup        | Joi              | Seal                    | Status          | Priority | Notes                  |
| ------------------ | ------------- | ---------- | ---------------- | ----------------------- | --------------- | -------- | ---------------------- |
| Description        | `.describe()` | `.meta()`  | `.description()` | ✅ `.describe()`        | Implemented     | -        | Add description        |
| Label              | ❌            | `.label()` | `.label()`       | ✅ `.label()`           | Implemented     | -        | Field label for errors |
| Error messages     | `.message()`  | ❌         | `.messages()`    | ✅ Error message params | Implemented     | -        | Custom error messages  |
| Attributes         | ❌            | ❌         | ❌               | ✅ `.attributes()`      | Implemented     | -        | Translation attributes |
| Brand/Opaque types | `.brand()`    | ❌         | ❌               | ❌                      | Not Implemented | 🔵 Low   | Nominal typing         |

---

## Missing High-Priority Features

### 1. ⭐ `.partial()` - Make All Fields Optional

```typescript
const createUser = v.object({
  name: v.string().required(),
  email: v.string().required(),
  age: v.number().required(),
});

const updateUser = createUser.partial();
// All fields become optional: { name?, email?, age? }
```

**Use case:** Every PATCH/update endpoint

---

### 2. ⭐ `.required()` - Make All Fields Required

```typescript
const draftPost = v.object({
  title: v.string(),
  content: v.string(),
  publishedAt: v.date(),
});

const publishedPost = draftPost.required();
// All fields become required
```

**Use case:** Draft vs published states

---

### 3. ⭐ `.nullable()` - Allow Null Values

```typescript
deletedAt: v.date().nullable(); // Date | null
bio: v.string().nullable(); // string | null
manager: v.int().nullable(); // number | null
```

**Use case:** Database nullable columns, optional relationships

---

### 4. ⭐ `.nullish()` - Allow Null or Undefined

```typescript
metadata: v.object({}).nullish(); // object | null | undefined
```

**Use case:** Truly optional fields that can be explicitly null

---

### 5. ⭐ `.record()` - Dynamic Object Keys

```typescript
// Object with unknown keys but typed values
const translations = v.record(v.string(), v.string());
// { [key: string]: string }

const settings = v.record(v.string(), v.boolean());
// { [key: string]: boolean }

const metadata = v.record(v.string(), v.union([v.string(), v.number()]));
// { [key: string]: string | number }
```

**Use case:** i18n translations, dynamic configuration, metadata objects

---

### 6. ⭐ `.lazy()` - Recursive/Self-Referencing Schemas

```typescript
type Category = {
  id: number;
  name: string;
  children: Category[]; // Self-reference!
};

const categorySchema: any = v.object({
  id: v.int().required(),
  name: v.string().required(),
  children: v.lazy(() => v.array(categorySchema)), // Recursive!
});
```

**Use case:** Trees, nested comments, hierarchical data, file systems

---

### 7. ⭐ `.discriminatedUnion()` - Type-Safe Polymorphic Unions

```typescript
const notification = v.discriminatedUnion("type", [
  v.object({
    type: v.literal("email"),
    email: v.string().email().required(),
    subject: v.string().required(),
  }),
  v.object({
    type: v.literal("sms"),
    phone: v.string().required(),
    message: v.string().required(),
  }),
  v.object({
    type: v.literal("push"),
    deviceId: v.string().required(),
    title: v.string().required(),
  }),
]);

// TypeScript knows exact shape based on 'type' field!
```

**Use case:** Polymorphic API responses, event systems, notification types

---

### 8. ⭐ UUID Validation

```typescript
id: v.string().uuid(); // Standard UUID
userId: v.string().uuid("v4"); // Specific version
```

**Use case:** Database IDs, API keys, unique identifiers

---

### 9. 🔶 `.tuple()` - Fixed-Length Typed Arrays

```typescript
const coordinates = v.tuple([v.number(), v.number()]);
// [number, number] - exactly 2 numbers

const userInfo = v.tuple([v.string(), v.number(), v.boolean()]);
// [string, number, boolean] - exact types in exact positions
```

**Use case:** Coordinates, fixed-structure data, CSV rows

---

### 10. 🔶 `.catchall()` - Validator for Unknown Keys

```typescript
const schema = v
  .object({
    knownField: v.string(),
  })
  .catchall(v.number());

// Input: { knownField: "test", extra1: 42, extra2: 100 }
// All unknown keys must be numbers
```

**Use case:** Flexible schemas with typed unknown keys

---

### 11. 🔶 `.pipe()` - Sequential Validation

```typescript
const schema = v
  .string()
  .transform(val => val.trim())
  .pipe(v.string().email()); // After transform, validate as email
```

**Use case:** Multi-stage validation with transformations

---

### 12. 🔶 `.catch()` / Failover Defaults

```typescript
// If validation fails, use default instead of error
count: v.number().catch(0); // Invalid → 0
settings: v.object({}).catch({}); // Invalid → {}
```

**Use case:** Resilient parsing, configuration files, user preferences

---

## Seal's Unique Features (Not in Others)

| Feature         | Description                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| Sibling scope   | All conditional validators have sibling variants (`.requiredWithSibling()`, etc.) |
| Smart detection | Date/number validators auto-detect value vs field comparison                      |
| Mutators        | Explicit separation: Mutators (prep) → Validators (check) → Transformers (output) |
| Transformers    | `addTransformer()`, `outputAs()`, `toJSON()` for output manipulation              |
| Date components | `.minYear()`, `.maxMonth()`, `.minDay()`, etc.                                    |
| Between methods | `.between()`, `.betweenYears()`, `.betweenMonths()`, etc.                         |
| Field omission  | `.omit()` to exclude from output but still validate                               |
| Custom options  | `.attributes()` for translation customization                                     |

---

## Recommended Implementation Roadmap

### Phase 1 (Critical - Next Sprint)

1. ⭐ `.partial()` - Make all fields optional
2. ⭐ `.nullable()` - Allow null values
3. ⭐ `.nullish()` - Allow null or undefined
4. ⭐ `.uuid()` - UUID validation

### Phase 2 (Important - Following Sprint)

5. ⭐ `.record()` - Dynamic object keys with typed values
6. ⭐ `.lazy()` - Recursive/circular schemas
7. ⭐ `.discriminatedUnion()` - Type-safe polymorphic unions
8. ⭐ `.required()` - Make all fields required

### Phase 3 (Enhancement)

9. 🔶 `.tuple()` - Fixed-length typed arrays
10. 🔶 `.catchall()` - Validator for unknown keys
11. 🔶 `.pipe()` - Sequential validation
12. 🔶 `.catch()` - Failover defaults
13. 🔶 `.deepPartial()` - Recursive partial
14. 🔶 Domain validation

### Phase 4 (Polish)

15. 🔵 `.keyof()` - Extract keys as enum
16. 🔵 Emoji validation
17. 🔵 CUID/ULID validation
18. 🔵 `.finite()`, `.safe()` for numbers
19. 🔵 `.brand()` - Nominal types
20. 🔵 `.set()` validator

---

## Feature Count Summary

**Seal Total Methods:** ~350+ methods

- BaseValidator: 75 methods
- StringValidator: 69 methods
- DateValidator: 75 methods
- NumberValidator: 28 methods
- ObjectValidator: 4 core + 6 composition = 10 methods
- ArrayValidator: 11 methods
- BooleanValidator: 14 methods
- UnionValidator: 1 method

**Missing Critical Features:** 8 (partial, nullable, nullish, required, uuid, record, lazy, discriminatedUnion)

**Seal Unique Features:** 10+ (sibling scope, smart detection, mutators, transformers, date components, between methods, etc.)

---

## Conclusion

Seal already has **extensive validation capabilities** that rival or exceed Zod/Yup/Joi in many areas (conditional validation, field comparison, date handling). The main gaps are:

1. **Nullability handling** (nullable, nullish)
2. **Schema modification utilities** (partial, required on all fields)
3. **Advanced types** (record, tuple, discriminatedUnion)
4. **Recursive schemas** (lazy)

Implementing Phase 1 features would make Seal feature-complete for 95% of use cases!
