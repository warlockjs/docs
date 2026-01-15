# Documentation Style Guide

This style guide defines the standards for all Warlock.js ecosystem documentation. It is derived from the [Documentation Constitution](/.specify/memory/constitution.md) and ensures consistency across all pages.

## Core Principles Reference

All documentation must adhere to the 5 core principles:

1. **Code Synchronization** - Docs match current package versions
2. **API-First Documentation** - All public APIs are documented
3. **Developer Experience** - Progressive disclosure, intuitive navigation
4. **TypeScript & Real-World Examples** - Practical, typed code
5. **Copy-Paste Ready Code** - Self-contained, executable examples

---

## File Structure

### Frontmatter (Required)

Every MDX file must include frontmatter:

```mdx
---
sidebar_position: 1
title: "Page Title"
description: "Brief description for SEO (under 160 characters)"
---
```

### Heading Hierarchy

- **h1 (`#`)** - Page title only (one per page)
- **h2 (`##`)** - Major sections
- **h3 (`###`)** - Subsections
- **h4 (`####`)** - Rarely used, for deeply nested content

```mdx
# Page Title

## Overview

### Basic Usage

### Advanced Usage

## Configuration

### Options Table

## Related
```

---

## Code Examples

### Language Specification

Always specify the language:

```mdx
```ts title="src/example.ts"
// TypeScript code here
```

```json
{
  "key": "value"
}
```
```

### Title Convention

Use `title="path/to/file.ts"` to show file paths:

```ts title="src/app/users/controllers/users-controller.ts"
import { Request, Response } from "@warlock.js/core";
```

### Import Requirements

**Every code example MUST include all required imports:**

```ts title="src/example.ts"
// ✅ CORRECT - includes imports
import { Request, Response, router } from "@warlock.js/core";
import { User } from "../models/user";

export async function getUser(request: Request, response: Response) {
  const user = await User.find(request.params.id);
  return response.success({ user });
}
```

```ts
// ❌ WRONG - missing imports
export async function getUser(request: Request, response: Response) {
  const user = await User.find(request.params.id);
  return response.success({ user });
}
```

### Output Comments

Show expected output inline:

```ts title="src/example.ts"
const user = await User.find("123");
console.log(user.data);
// Output: { id: "123", name: "John", email: "john@example.com" }
```

### Variable Naming

Use domain-relevant names, NOT placeholders:

```ts
// ✅ CORRECT
const user = await User.find(userId);
const order = await Order.create({ customerId, items });

// ❌ WRONG
const foo = await Model.find(bar);
const x = await Thing.create({ a, b });
```

---

## Admonitions

Use Docusaurus admonitions for callouts:

### Info - Background information

```mdx
:::info
Cache is automatically cleared when models are updated.
:::
```

### Tip - Helpful suggestions

```mdx
:::tip
Use TypeScript's strict mode for better type checking.
:::
```

### Warning - Important cautions

```mdx
:::warning
This operation cannot be undone.
:::
```

### Danger - Critical warnings

```mdx
:::danger
Never expose your JWT secret in client-side code.
:::
```

### Note - Additional context

```mdx
:::note
This feature requires Node.js 18 or higher.
:::
```

---

## Tables

Use tables for configuration options and comparisons:

```mdx
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `driver` | `string` | `"memory"` | Cache driver to use |
| `ttl` | `number` | `3600` | Time to live in seconds |
| `prefix` | `string` | `""` | Key prefix for namespacing |
```

### Column Guidelines

- **Option/Property**: Code format with backticks
- **Type**: TypeScript type notation
- **Default**: Actual default value or `-` for required
- **Description**: Brief, clear description

---

## Links

### Internal Links (Relative)

Use relative paths for internal documentation links:

```mdx
<!-- Same folder -->
[Installation](./installation.mdx)

<!-- Parent folder -->
[Getting Started](./../getting-started/introduction.mdx)

<!-- Cross-package -->
[Cascade Models](../../cascade/models/introduction.mdx)
```

### External Links

Use full URLs for external resources:

```mdx
[Fastify Documentation](https://fastify.dev/)
[MongoDB Manual](https://www.mongodb.com/docs/manual/)
```

### Link Text Guidelines

- Use descriptive text, not "click here" or "read more"
- Match the target page title when possible
- Keep link text concise

---

## Page Structure Template

Every documentation page should follow this structure:

```mdx
---
sidebar_position: 1
title: "Feature Name"
description: "What this feature does in one sentence"
---

# Feature Name

Brief introduction (1-2 sentences) explaining what this page covers.

## Overview

- **What** is this feature?
- **Why** would you use it?
- **When** should you use it?

## Prerequisites

:::info Prerequisites
- [Completed Getting Started guide](../getting-started/introduction.mdx)
- Basic understanding of [related concept](./related-page.mdx)
:::

## Basic Usage

The simplest way to use this feature:

```ts title="src/basic-example.ts"
import { Feature } from "@warlock.js/core";

const result = await Feature.doSomething();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| ... | ... | ... | ... |

## Common Patterns

### Pattern 1

Description and example...

### Pattern 2

Description and example...

## Error Handling

:::warning Common Errors
**Error message here**
- Cause: What causes this error
- Solution: How to fix it
:::

## Best Practices

1. **Do this** - Explanation
2. **Avoid that** - Explanation

## Related

- [Related Feature 1](./related-1.mdx)
- [Related Feature 2](./related-2.mdx)
- [API Reference](./api-reference.mdx)
```

---

## API Reference Format

For API documentation pages:

```mdx
# ClassName

Brief description.

## Import

```ts
import { ClassName } from "@warlock.js/package";
```

## Constructor

```ts
new ClassName(options?: ClassNameOptions)
```

### Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|

## Properties

### propertyName

```ts
readonly propertyName: PropertyType
```

Description of property.

## Methods

### methodName()

```ts
async methodName(param: ParamType): Promise<ReturnType>
```

Description.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|

**Returns:** `ReturnType` - Description

**Example:**

```ts title="src/method-example.ts"
// Complete example with imports
```

## Types

```ts
interface ClassNameOptions {
  // Type definition
}
```
```

---

## Checklist Before Publishing

Before submitting documentation:

- [ ] Frontmatter includes title and description
- [ ] All code examples include imports
- [ ] Code examples are TypeScript (not JavaScript)
- [ ] Examples use realistic, domain-relevant variable names
- [ ] All internal links use relative paths
- [ ] Configuration tables are complete
- [ ] Page answers "what", "why", and "how"
- [ ] Related section links to relevant pages
- [ ] No broken links (verified with `yarn build`)

---

## Version-Specific Content

When documentation differs between versions:

```mdx
:::note Version Compatibility
This feature is available in v4.x and later. For v3.x, see [v3.x documentation](/v3/path/to/page).
:::
```

For deprecated features:

```mdx
:::warning Deprecated
This method is deprecated in v4.x. Use [`newMethod()`](./new-method.mdx) instead.

Migration:
```ts
// Before (v3.x)
const result = await oldMethod();

// After (v4.x)
const result = await newMethod();
```
:::
```
