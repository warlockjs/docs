# Import Resolution System

This document explains how the import resolution system works in the dev server.

## Overview

The `parse-imports.ts` module is responsible for:
1. Parsing imports from TypeScript/JavaScript source code
2. Resolving import paths to actual file paths on disk
3. Handling different import types (relative, alias, external)

## Import Types

### 1. Node.js Built-in Modules
**Skipped** - Not tracked as dependencies

```typescript
import fs from "fs";
import path from "node:path";
import { readFile } from "fs/promises";
```

### 2. External Packages (node_modules)
**Skipped** - Not tracked as dependencies

```typescript
import { Request } from "@warlock.js/core";
import express from "express";
```

### 3. Relative Imports
**Resolved** - Converted to absolute paths with proper extensions

```typescript
// Import without extension
import { getUsersService } from "../services/get-users.service";

// Resolved to:
// D:/xampp/htdocs/mentoor/apps/online-store/dev-server/src/app/users/services/get-users.service.ts
```

### 4. Alias Imports (TypeScript Path Mapping)
**Resolved** - Converted to absolute paths using tsconfig paths

```typescript
// Import using alias
import { User } from "app/users/models/user/user.model";

// Resolved to:
// D:/xampp/htdocs/mentoor/apps/online-store/dev-server/src/app/users/models/user/user.model.ts
```

## Resolution Process

### Step 1: Parse Imports
Uses `es-module-lexer` to extract import statements from source code.

### Step 2: Filter Imports
- Skip Node.js built-in modules
- Skip external packages (node_modules)
- Keep only relative imports (starting with `.`) and alias imports

### Step 3: Resolve Paths

#### For Relative Imports:
1. Get the directory of the current file
2. Resolve the import path relative to that directory
3. Try to find the file with various extensions (.ts, .tsx, .js, .jsx, etc.)
4. If it's a directory, look for index files

#### For Alias Imports:
1. Match the import path against tsconfig paths
2. Replace the alias pattern with the target path
3. Try to find the file with various extensions
4. If it's a directory, look for index files

### Step 4: Extension Resolution
The system tries these extensions in order:
1. `.ts` - TypeScript files
2. `.tsx` - TypeScript with JSX
3. `.js` - JavaScript files
4. `.jsx` - JavaScript with JSX
5. `.mjs` - ES Module JavaScript
6. `.cjs` - CommonJS JavaScript

If the import points to a directory, it looks for:
- `index.ts`
- `index.tsx`
- `index.js`
- `index.jsx`
- `index.mjs`
- `index.cjs`

## Configuration

### TypeScript Path Aliases

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "app/*": ["src/app/*"],
      "core/*": ["core/*"]
    }
  }
}
```

This allows imports like:
- `app/users/services/get-users.service` → `src/app/users/services/get-users.service.ts`
- `core/utils/paths` → `core/utils/paths.ts`

## Example Usage

```typescript
import { parseImports } from "./parse-imports";
import { tsconfigManager } from "./tsconfig-manager";

// Initialize tsconfig manager first
await tsconfigManager.init();

const sourceCode = `
  import { Request } from "@warlock.js/core";
  import { getUsersService } from "../services/get-users.service";
  import { User } from "app/users/models/user/user.model";
  import fs from "fs";
`;

const filePath = "src/app/users/controllers/get-users.controller.ts";
const resolvedImports = await parseImports(sourceCode, filePath);

console.log(resolvedImports);
// Output:
// [
//   "D:/xampp/htdocs/mentoor/apps/online-store/dev-server/src/app/users/services/get-users.service.ts",
//   "D:/xampp/htdocs/mentoor/apps/online-store/dev-server/src/app/users/models/user/user.model.ts"
// ]
```

## API Reference

### `parseImports(source: string, filePath: string): Promise<string[]>`

Parses imports from source code and resolves them to absolute file paths.

**Parameters:**
- `source` - The source code to parse
- `filePath` - The absolute path of the file being parsed

**Returns:**
- Array of resolved absolute file paths (normalized with forward slashes)

---

### TSConfigManager API

#### `tsconfigManager.init(): Promise<void>`

Initializes the tsconfig manager by loading and parsing tsconfig.json.
Must be called before using any other tsconfig manager methods.

#### `tsconfigManager.isAlias(importPath: string): boolean`

Checks if an import path matches any configured alias.

**Parameters:**
- `importPath` - The import path to check

**Returns:**
- `true` if the path matches an alias, `false` otherwise

#### `tsconfigManager.getMatchingAlias(importPath: string): string | null`

Gets the alias key that matches the given import path.

**Parameters:**
- `importPath` - The import path to check

**Returns:**
- The matching alias key (e.g., `"app/*"`) or `null` if no match

#### `tsconfigManager.resolveAliasPath(importPath: string): string | null`

Resolves an alias import path to a relative path based on tsconfig paths.

**Parameters:**
- `importPath` - The import path with alias (e.g., `"app/users/services/get-users.service"`)

**Returns:**
- The resolved relative path (e.g., `"src/app/users/services/get-users.service"`) or `null` if alias not found

**Example:**
```typescript
const relativePath = tsconfigManager.resolveAliasPath("app/users/models/user");
// Returns: "src/app/users/models/user"
```

#### `tsconfigManager.resolveAliasToAbsolute(importPath: string): string | null`

Resolves an alias import path to an absolute path.

**Parameters:**
- `importPath` - The import path with alias

**Returns:**
- The resolved absolute path or `null` if alias not found

**Example:**
```typescript
const absolutePath = tsconfigManager.resolveAliasToAbsolute("app/users/models/user");
// Returns: "D:/project/src/app/users/models/user"
```

## Implementation Details

### File Extension Resolution

The system handles TypeScript's convention of omitting file extensions in imports:

```typescript
// These are equivalent:
import { User } from "./user.model";
import { User } from "./user.model.ts";
```

The resolver will:
1. Check if `./user.model` exists (exact match)
2. Try `./user.model.ts`
3. Try `./user.model.tsx`
4. Try other extensions
5. Check if it's a directory and look for index files

### Normalized Paths

All resolved paths are normalized to use forward slashes (`/`) regardless of the operating system, ensuring consistency across Windows, macOS, and Linux.

### Performance Considerations

- File existence checks are async using `fileExistsAsync`
- Extensions are tried in order of likelihood
- The system caches tsconfig data after initialization

## Future Improvements

Potential enhancements:
1. Cache resolved paths to avoid repeated file system checks
2. Support for package.json `exports` field resolution
3. Support for `.json` and `.css` imports
4. Better handling of circular dependencies
5. Support for dynamic imports

