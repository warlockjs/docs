# Warlock Seal - Complete Validation Reference

A comprehensive list of all validation rules, methods, and mutators available in `@warlock.js/seal`.

**Total Rules: 73**
**Total Validator Methods: 117+**
**Total Mutators: 18**

---

## 📋 Table of Contents

1. [Core Rules & Methods](#core-rules--methods)
2. [String Validator](#string-validator)
3. [Number Validator](#number-validator)
4. [Array Validator](#array-validator)
5. [Date Validator](#date-validator)
6. [Boolean Validator](#boolean-validator)
7. [Object Validator](#object-validator)
8. [Scalar Validator](#scalar-validator)
9. [Conditional Rules](#conditional-rules)
10. [Mutators](#mutators)

---

## Core Rules & Methods

Available on all validators through `BaseValidator`.

### Core Validation Rules

| Rule            | Method                     | Description                         |
| --------------- | -------------------------- | ----------------------------------- |
| `requiredRule`  | `.required()`              | Value must be present and not empty |
| `forbiddenRule` | `.forbidden()`             | Value must not be present           |
| `equalRule`     | `.equals(value)`           | Value must equal specific value     |
| `whenRule`      | `.when(field, conditions)` | Conditional validation              |

### Core Methods (Available on All Validators)

| Method                     | Description               |
| -------------------------- | ------------------------- |
| `.required()`              | Mark field as required    |
| `.optional()`              | Mark field as optional    |
| `.forbidden()`             | Field must not be present |
| `.equals(value)`           | Must equal specific value |
| ``                         | Skip validation if empty  |
| `.when(field, conditions)` | Conditional validation    |

**Total Core: 4 rules**

---

## String Validator

### String Rules (37 methods)

| Category       | Method                                | Description                      |
| -------------- | ------------------------------------- | -------------------------------- |
| **Type**       | `.email()`                            | Valid email address              |
|                | `.url()`                              | Valid URL                        |
|                | `.ip()`                               | Valid IP address (v4 or v6)      |
|                | `.ip4()` / `.ipv4()`                  | Valid IPv4 address               |
|                | `.ip6()` / `.ipv6()`                  | Valid IPv6 address               |
|                | `.creditCard()`                       | Valid credit card number         |
| **Content**    | `.alpha()`                            | Only alphabetic characters       |
|                | `.alphanumeric()`                     | Only alphanumeric characters     |
|                | `.numeric()`                          | Only numeric characters (string) |
|                | `.withoutWhitespace()`                | No whitespace allowed            |
| **Pattern**    | `.pattern(regex)`                     | Match regex pattern              |
|                | `.matches(field)`                     | Match another field's value      |
|                | `.confirmedWith(field)`               | Alias for `.matches()`           |
| **Comparison** | `.startsWith(str)`                    | Must start with string           |
|                | `.endsWith(str)`                      | Must end with string             |
|                | `.contains(str)`                      | Must contain string              |
|                | `.notContains(str)`                   | Must not contain string          |
| **Length**     | `.minLength(n)` / `.min(n)`           | Minimum length                   |
|                | `.maxLength(n)` / `.max(n)`           | Maximum length                   |
|                | `.length(n)`                          | Exact length                     |
| **Words**      | `.words(n)`                           | Exact word count                 |
|                | `.minWords(n)`                        | Minimum word count               |
|                | `.maxWords(n)`                        | Maximum word count               |
| **Color**      | `.color()`                            | Valid color (any format)         |
|                | `.hexColor()`                         | Valid hex color                  |
|                | `.rgbColor()`                         | Valid RGB color                  |
|                | `.rgbaColor()`                        | Valid RGBA color                 |
|                | `.hslColor()`                         | Valid HSL color                  |
|                | `.lightColor()`                       | Light color (luminance > 0.5)    |
|                | `.darkColor()`                        | Dark color (luminance < 0.5)     |
| **Value Sets** | `.enum(values)`                       | Must be in enum                  |
|                | `.in(values)` / `.oneOf(values)`      | Must be in array                 |
|                | `.allowsOnly(values)`                 | Allowed values                   |
|                | `.forbids(values)` / `.notIn(values)` | Forbidden values                 |
| **Mutators**   | `.lowercase()`                        | Convert to lowercase             |
|                | `.uppercase()`                        | Convert to uppercase             |
|                | `.capitalize()`                       | Capitalize first letter          |

**Total: 16 rules + 21 aliases = 37 methods**

---

## Number Validator

### Number Rules (12 methods)

| Method                                | Description            |
| ------------------------------------- | ---------------------- |
| `.min(n)`                             | Minimum numeric value  |
| `.max(n)`                             | Maximum numeric value  |
| `.positive()`                         | Must be positive (> 0) |
| `.modulo(n)`                          | Must be divisible by n |
| `.enum(values)`                       | Must be in enum        |
| `.in(values)` / `.oneOf(values)`      | Must be in array       |
| `.allowsOnly(values)`                 | Allowed values         |
| `.forbids(values)` / `.notIn(values)` | Forbidden values       |
| `.length(n)`                          | Exact digit length     |
| `.minLength(n)`                       | Minimum digit length   |
| `.maxLength(n)`                       | Maximum digit length   |

**Total: 4 rules + 8 aliases = 12 methods**

---

## Array Validator

### Array Rules (10 methods)

| Category       | Method                   | Description                   |
| -------------- | ------------------------ | ----------------------------- |
| **Validation** | `.unique()`              | Array must have unique values |
|                | `.minLength(n)`          | Minimum array length          |
|                | `.maxLength(n)`          | Maximum array length          |
|                | `.length(n)`             | Exact array length            |
| **Mutators**   | `.flip()` / `.reverse()` | Reverse array order           |
|                | `.onlyUnique()`          | Remove duplicates             |
|                | `.sort(direction, key?)` | Sort array (asc/desc)         |

**Total: 1 rule + 9 methods = 10 methods**

---

## Date Validator

### Date Rules (3 methods)

| Method           | Description                     |
| ---------------- | ------------------------------- |
| `.date(format?)` | Valid date with optional format |
| `.before(date)`  | Date must be before given date  |
| `.after(date)`   | Date must be after given date   |

Note: `before()` uses `maxDateRule`, `after()` uses `minDateRule`

**Total: 3 rules = 3 methods**

---

## Boolean Validator

### Boolean Rules (1 method)

| Method           | Description     |
| ---------------- | --------------- |
| Constructor only | Type validation |

**Total: 1 rule = 1 method**

---

## Object Validator

### Object Methods (5 methods)

| Method                | Description                 |
| --------------------- | --------------------------- |
| `.stripUnknown()`     | Remove unknown keys         |
| `.allow(...keys)`     | Allow additional keys       |
| `.allowUnknown(bool)` | Toggle unknown key handling |
| `.trim(recursive)`    | Trim all string values      |

**Total: 0 rules + 5 methods = 5 methods**

---

## Scalar Validator

Base validator for string/number with value checking.

### Scalar Methods (7 methods)

| Method                | Description            |
| --------------------- | ---------------------- |
| `.enum(values)`       | Must be in enum        |
| `.in(values)`         | Must be in array       |
| `.oneOf(values)`      | Alias for `.in()`      |
| `.allowsOnly(values)` | Allowed values         |
| `.forbids(values)`    | Forbidden values       |
| `.notIn(values)`      | Alias for `.forbids()` |

**Total: 4 rules + 3 aliases = 7 methods**

---

## Conditional Rules

### Required If/Unless Rules (19 rules)

| Rule                | Method                                      | Description                                 |
| ------------------- | ------------------------------------------- | ------------------------------------------- |
| **Single Field**    | `.requiredIfAbsent(field)`                  | Required if field absent (global)           |
|                     | `.requiredIfMissing(field)`                 | Alias for `requiredIfAbsent`                |
|                     | `.requireIfSiblingIsAbsent(field)`          | Required if sibling absent                  |
|                     | `.requiredIfEmpty(field)`                   | Required if field empty (global)            |
|                     | `.requiredIfSiblingFieldEmpty(field)`       | Required if sibling empty                   |
| **Multiple Fields** | `.requiredIfAllMissing(fields)`             | Required if ALL absent (global)             |
|                     | `.requiredIfAllAbsent(fields)`              | Alias                                       |
|                     | `.requiredIfAnyMissing(fields)`             | Required if ANY absent (global)             |
|                     | `.requiredIfAnyAbsent(fields)`              | Alias                                       |
|                     | `.requiredIfAllSiblingsMissing(fields)`     | Required if ALL siblings absent             |
|                     | `.requiredIfAllSiblingsAbsent(fields)`      | Alias                                       |
|                     | `.requiredIfAnySiblingMissing(fields)`      | Required if ANY sibling absent              |
|                     | `.requiredIfAnySiblingAbsent(fields)`       | Alias                                       |
|                     | `.requiredIfSiblingFieldAllAbsent(fields)`  | Legacy method                               |
| **Conditional**     | `.requiredIf(field, value)`                 | Required if field equals value (global)     |
|                     | `.requiredIfSiblingField(field, value)`     | Required if sibling equals value            |
|                     | `.requiredUnless(field, value)`             | Required unless field equals value (global) |
|                     | `.requiredUnlessSiblingField(field, value)` | Required unless sibling equals value        |
| **With/Without**    | `.requiredWith(field)`                      | Required if field present (global)          |
|                     | `.requiredWithAll(fields)`                  | Required if ALL fields present              |

**Total: 13 unique rules + 6 aliases/variants = 19+ methods**

---

## Mutators

Mutators transform/modify data before or after validation.

### String Mutators (10)

| Mutator                          | Method          | Description                    |
| -------------------------------- | --------------- | ------------------------------ |
| `lowercaseMutator`               | `.lowercase()`  | Convert to lowercase           |
| `uppercaseMutator`               | `.uppercase()`  | Convert to uppercase           |
| `capitalizeMutator`              | `.capitalize()` | Capitalize first letter        |
| `stringMutator`                  | Auto-applied    | Convert to string              |
| `trimMutator`                    | Manual          | Trim whitespace                |
| `trimMultipleWhitespaceMutator`  | Manual          | Trim multiple spaces to single |
| `safeHtmlMutator`                | Manual          | Remove HTML tags               |
| `htmlEscapeMutator`              | Manual          | Escape HTML entities           |
| `removeSpecialCharactersMutator` | Manual          | Remove special chars           |
| `urlDecodeMutator`               | Manual          | URL decode string              |

### Number Mutators (3)

| Mutator              | Method       | Description        |
| -------------------- | ------------ | ------------------ |
| `numberMutator`      | Auto-applied | Convert to number  |
| `roundNumberMutator` | Manual       | Round to decimals  |
| `booleanMutator`     | Auto-applied | Convert to boolean |

### Array Mutators (5)

| Mutator                           | Method                   | Description        |
| --------------------------------- | ------------------------ | ------------------ |
| `flipArrayMutator`                | `.flip()` / `.reverse()` | Reverse array      |
| `sortArrayMutator`                | `.sort(direction, key?)` | Sort array         |
| `uniqueArrayMutator`              | `.onlyUnique()`          | Remove duplicates  |
| `removeEmptyArrayElementsMutator` | Manual                   | Remove empty items |

### Date Mutators (1)

| Mutator       | Description            |
| ------------- | ---------------------- |
| `dateMutator` | Convert to Date object |

### Object Mutators (3)

| Mutator               | Method             | Description         |
| --------------------- | ------------------ | ------------------- |
| `stripUnknownMutator` | `.stripUnknown()`  | Remove unknown keys |
| `objectTrimMutator`   | `.trim(recursive)` | Trim all strings    |
| `jsonMutator`         | Manual             | Parse JSON string   |

**Total: 18 mutators**

---

## Summary

| Category     | Rules  | Methods/Aliases | Total Methods |
| ------------ | ------ | --------------- | ------------- |
| Core         | 4      | +2              | 6             |
| String       | 16     | +21             | 37            |
| Number       | 4      | +8              | 12            |
| Array        | 1      | +9              | 10            |
| Date         | 3      | 0               | 3             |
| Boolean      | 1      | 0               | 1             |
| Object       | 0      | 5               | 5             |
| Scalar       | 4      | +3              | 7             |
| Conditional  | 13     | +6+             | 19+           |
| **Total**    | **73** | **~54+**        | **117+**      |
| **Mutators** | —      | —               | **18**        |

---

## Notes

- **Framework-specific rules** (database, file uploads) are in `@warlock.js/core/v`
- **Auto-applied mutators**: Automatically applied by validator constructors
- **Manual mutators**: Must be explicitly called using `.addMutator()`
- **Aliases**: Many methods have aliases for better DX (e.g., `min`/`minLength`)
- **Scope variants**: Conditional rules support global (`allValues`) and sibling (`parent`) scopes
