# Quickstart Guide: Documentation Development

**Feature**: 001-ecosystem-docs
**Date**: 2026-01-15

## Overview

This guide helps documentation contributors get started quickly. It covers setting up the documentation site locally, understanding the structure, and creating new documentation pages.

## Prerequisites

- Node.js 18+
- Yarn or npm
- Git
- Code editor (VS Code recommended with MDX extension)

## Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/hassanzohdy/warlock.js-docs.git
cd warlock.js-docs

# Install dependencies
yarn install
```

### 2. Start Development Server

```bash
yarn start
```

The documentation site will be available at `http://localhost:3000`.

### 3. Verify Source Packages

The `@warlock.js/` directory contains source code for API reference:

```bash
ls @warlock.js/
# auth  cache  cascade  context  core  herald  logger  postman  scheduler  seal  template  vest
```

## Project Structure

```text
warlock-docs/
├── docs/                   # v4.x documentation (edit here)
│   ├── warlock/           # Core framework
│   ├── cascade/           # MongoDB ODM
│   ├── seal/              # Validation
│   └── cache/             # Caching
├── versioned_docs/        # v3.x docs (frozen, don't edit)
├── @warlock.js/           # Source packages (API reference source)
├── src/                   # Site components
├── static/                # Static assets
├── sidebars.ts            # Navigation configuration
└── docusaurus.config.ts   # Site configuration
```

## Creating Documentation

### Step 1: Identify the Package and Category

Determine which package and category your documentation belongs to:

| Package | Directory | Sidebar |
|---------|-----------|---------|
| Warlock Core | `docs/warlock/` | `warlock` |
| Cascade | `docs/cascade/` | `mongodb` |
| Seal | `docs/seal/` | `seal` |
| Cache | `docs/cache/` | `cache` |

### Step 2: Create the MDX File

Create a new `.mdx` file in the appropriate directory:

```bash
# Example: Create a new page in Warlock HTTP section
touch docs/warlock/http/cookies.mdx
```

### Step 3: Add Frontmatter

Every page needs frontmatter:

```mdx
---
sidebar_position: 5
title: "Working with Cookies"
description: "Learn how to read and set cookies in Warlock.js"
---
```

### Step 4: Write Content

Follow the page structure from the Documentation Structure Contract:

```mdx
---
sidebar_position: 5
---

# Working with Cookies

Warlock.js provides easy-to-use methods for reading and setting cookies in your HTTP handlers.

## Reading Cookies

To read a cookie from an incoming request:

\`\`\`ts title="src/controllers/user.ts"
import { Request } from "@warlock.js/core";

export function getUser(request: Request) {
  const sessionId = request.cookie("session_id");
  // Use the cookie value
}
\`\`\`

## Setting Cookies

To set a cookie in the response:

\`\`\`ts title="src/controllers/auth.ts"
import { Response } from "@warlock.js/core";

export function login(response: Response) {
  response.cookie("session_id", "abc123", {
    httpOnly: true,
    secure: true,
    maxAge: 86400, // 1 day in seconds
  });
}
\`\`\`

## Cookie Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| httpOnly | boolean | false | Prevents JavaScript access |
| secure | boolean | false | HTTPS only |
| maxAge | number | - | Lifetime in seconds |
| path | string | "/" | Cookie path |
| domain | string | - | Cookie domain |

## Related

- [Request Object](./request.mdx)
- [Response Object](./response.mdx)
```

### Step 5: Update Sidebar (if needed)

For manually configured sidebars, add the page to `sidebars.ts`:

```ts
// sidebars.ts
cache: [
  {
    type: 'category',
    label: 'Getting Started',
    items: [
      'cache/introduction',
      'cache/quick-start',
      'cache/cookies',  // Add new page
    ],
  },
],
```

For auto-generated sidebars (Warlock, Cascade), the page appears automatically based on `sidebar_position`.

### Step 6: Verify

1. Check the development server shows your page
2. Verify all links work
3. Test code examples compile

```bash
# Build to catch broken links
yarn build
```

## Code Example Guidelines

### Always Include Imports

```ts
// ✅ Correct
import { Model } from "@warlock.js/cascade";

export class User extends Model {
  static collection = "users";
}

// ❌ Wrong - missing import
export class User extends Model {
  static collection = "users";
}
```

### Use Meaningful Names

```ts
// ✅ Correct
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
});

// ❌ Wrong
const foo = await Bar.create({
  x: "test",
  y: "bar",
});
```

### Show File Paths

```ts title="src/models/user.ts"
// Code here
```

### Include Expected Output

```ts
console.log(user.data);
// Output:
// {
//   id: 1,
//   name: "John Doe",
//   email: "john@example.com"
// }
```

## Extracting API Information

When documenting an API, extract information from the source:

### 1. Find the Source File

```bash
# Example: Find the Model class
cat @warlock.js/cascade/model/model.ts
```

### 2. Extract Type Signatures

Look for:
- Class definitions
- Method signatures
- Interface definitions
- Type exports

### 3. Document in Page

```mdx
## Methods

### create()

\`\`\`ts
static async create<T>(data: Partial<T>): Promise<Model<T>>
\`\`\`

Creates a new document in the collection.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| data | Partial<T> | The data to insert |

**Returns:** Promise<Model<T>> - The created model instance
```

## Testing Your Documentation

### 1. Visual Check

- Navigate to your page in the browser
- Verify formatting looks correct
- Check code blocks render properly

### 2. Link Validation

```bash
yarn build
# Build will fail if links are broken
```

### 3. Code Example Testing

Copy examples to a test Warlock.js project:

```bash
# In a separate Warlock.js project
npx tsc --noEmit
# Should compile without errors
```

## Common Issues

### Page Not Appearing in Sidebar

- Check `sidebar_position` in frontmatter
- For manual sidebars, add to `sidebars.ts`
- Restart dev server after sidebar changes

### Broken Links

- Use relative paths: `./page.mdx` or `../category/page.mdx`
- Verify target file exists
- Run `yarn build` to catch all broken links

### Code Block Not Highlighting

- Add language identifier: ` ```ts `
- Use supported languages: ts, js, json, bash, yaml

## Next Steps

1. Review the [Documentation Structure Contract](./contracts/documentation-structure.md)
2. Check [Package Coverage](./contracts/package-coverage.md) for what needs documentation
3. Start with pages marked "Needs creation" in your assigned package
