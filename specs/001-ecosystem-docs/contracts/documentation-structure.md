# Documentation Structure Contract

**Feature**: 001-ecosystem-docs
**Date**: 2026-01-15

## Overview

This contract defines the expected structure for all documentation pages and navigation. Implementations MUST adhere to these specifications to ensure consistency and constitution compliance.

## Navigation Hierarchy

### Top-Level Sections

```yaml
navigation:
  - name: Warlock
    path: /docs/warlock
    sidebar: warlock
    priority: 1

  - name: Cascade
    path: /docs/cascade
    sidebar: mongodb
    priority: 2

  - name: Seal
    path: /docs/seal
    sidebar: seal
    priority: 3

  - name: Cache
    path: /docs/cache
    sidebar: cache
    priority: 4
```

### Package Category Structure

Each major package MUST have these categories (in order):

```yaml
categories:
  - name: getting-started
    label: "Getting Started"
    collapsed: false
    required_pages:
      - introduction
      - installation
      - quick-start

  - name: core-concepts
    label: "Core Concepts"
    collapsed: true
    required_pages: []  # Package-specific

  - name: api-reference
    label: "API Reference"
    collapsed: true
    required_pages: []  # Auto-generated from source

  - name: guides
    label: "Guides"
    collapsed: true
    required_pages:
      - best-practices

  - name: advanced
    label: "Advanced"
    collapsed: true
    required_pages: []  # Package-specific
```

---

## Page Structure Contract

### Frontmatter (Required)

```yaml
---
sidebar_position: <number>
title: <string>  # Optional, defaults to h1
description: <string>  # For SEO
---
```

### Content Structure

Every page MUST follow this structure:

```markdown
# Page Title

[1-2 sentence description of what this page covers]

## [Section 1 - varies by page type]

[Content]

## [Section 2 - varies by page type]

[Content]

## Related

- [Link to related page 1](./path.mdx)
- [Link to related page 2](./path.mdx)
```

---

## Page Type Contracts

### Introduction Page

**Purpose**: First page a user sees for a package
**File**: `{package}/getting-started/introduction.mdx`

```markdown
# {Package Name}

[Brief description - what is this package?]

## Features

- Feature 1
- Feature 2
- Feature 3

## When to Use

[Explain use cases]

## Quick Example

\`\`\`ts
// Minimal working example (< 20 lines)
\`\`\`

## Next Steps

- [Installation](./installation.mdx)
- [Quick Start](./quick-start.mdx)
```

### Installation Page

**Purpose**: How to add the package to a project
**File**: `{package}/getting-started/installation.mdx`

```markdown
# Installation

## Prerequisites

- Node.js 18+
- [Other requirements]

## Install via npm

\`\`\`bash
npm install @warlock.js/{package}
\`\`\`

## Install via yarn

\`\`\`bash
yarn add @warlock.js/{package}
\`\`\`

## Configuration

[Basic config if needed]

## Verify Installation

\`\`\`ts
// Code to verify it works
\`\`\`
```

### Quick Start Page

**Purpose**: Get something working in 5-15 minutes
**File**: `{package}/getting-started/quick-start.mdx`

```markdown
# Quick Start

[What we'll build in this guide]

## Step 1: [Action]

\`\`\`ts title="src/file.ts"
// Code
\`\`\`

## Step 2: [Action]

\`\`\`ts title="src/file.ts"
// Code
\`\`\`

## Step 3: [Action]

\`\`\`ts title="src/file.ts"
// Code
\`\`\`

## Result

[What you should have now]

## Next Steps

- [Learn about X](../concepts/x.mdx)
```

### Concept Page

**Purpose**: Explain a concept or feature
**File**: `{package}/concepts/{concept}.mdx`

```markdown
# {Concept Name}

[What is this concept?]

## How It Works

[Explanation with diagrams if helpful]

## Basic Usage

\`\`\`ts title="src/example.ts"
// Complete example
\`\`\`

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| option1 | string | "value" | What it does |

## Common Patterns

### Pattern 1: [Name]

\`\`\`ts
// Example
\`\`\`

## Troubleshooting

### [Common Issue 1]

[Solution]

## Related

- [Related concept](./related.mdx)
```

### API Reference Page

**Purpose**: Document a class, function, or interface
**File**: `{package}/api/{name}.mdx`

```markdown
# {ClassName}

[Brief description]

## Import

\`\`\`ts
import { ClassName } from "@warlock.js/{package}";
\`\`\`

## Constructor

\`\`\`ts
new ClassName(options?: Options)
\`\`\`

### Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| prop1 | string | Yes | - | Description |

## Properties

### propertyName

\`\`\`ts
propertyName: Type
\`\`\`

Description.

## Methods

### methodName()

\`\`\`ts
methodName(param: Type): ReturnType
\`\`\`

Description.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| param | Type | Description |

**Returns:** `ReturnType` - Description

**Example:**

\`\`\`ts title="src/example.ts"
import { ClassName } from "@warlock.js/{package}";

const instance = new ClassName();
const result = instance.methodName(value);
\`\`\`

## Static Methods

### ClassName.staticMethod()

[Same format as instance methods]

## Events

### eventName

Fired when [condition].

**Payload:**

\`\`\`ts
interface EventPayload {
  property: Type;
}
\`\`\`

## See Also

- [Related class](./related.mdx)
```

---

## Code Example Contract

All code examples MUST:

1. **Include language identifier**
   ```ts
   // ✅ Correct
   ```ts
   code here
   ```

   // ❌ Wrong
   ```
   code here
   ```

2. **Include file path for multi-file examples**
   ```ts title="src/models/user.ts"
   // Code
   ```

3. **Include ALL imports**
   ```ts
   // ✅ Correct
   import { Model } from "@warlock.js/cascade";
   import { User } from "./user";

   // ❌ Wrong - missing imports
   const user = new User();
   ```

4. **Use meaningful names**
   ```ts
   // ✅ Correct
   const user = await User.create({ name: "John Doe", email: "john@example.com" });

   // ❌ Wrong - placeholder names
   const foo = await Bar.create({ x: "test", y: "bar" });
   ```

5. **Show expected output when relevant**
   ```ts
   console.log(user.data);
   // Output:
   // { id: 1, name: "John Doe", email: "john@example.com" }
   ```

---

## Cross-Reference Contract

### Internal Links

```markdown
<!-- Same package -->
[Page Title](./page.mdx)
[Page Title](../category/page.mdx)

<!-- Different package -->
[Cascade Models](../../cascade/models/introduction.mdx)
```

### Admonitions

Use Docusaurus admonitions for callouts:

```markdown
:::tip
Helpful tip
:::

:::warning
Important warning
:::

:::danger
Critical warning
:::

:::info
Additional information
:::
```

---

## Validation Rules

Before publishing, verify:

- [ ] All frontmatter fields present
- [ ] Page follows appropriate type template
- [ ] All code examples have language specified
- [ ] All imports are complete
- [ ] No placeholder names in examples
- [ ] All links are relative and valid
- [ ] Page answers "what", "why", "how"
- [ ] Related section links to relevant pages
