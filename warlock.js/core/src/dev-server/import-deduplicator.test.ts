/**
 * Tests for Import Deduplicator
 *
 * Run with: npx tsx @warlock.js/core/src/dev-server/import-deduplicator.test.ts
 */

import {
  buildGroupImportStatement,
  deduplicateImports,
  isLocalImport,
  mergeBindings,
  parseImportSpecifier,
  type ImportGroup,
} from "./import-deduplicator";

// Simple test runner
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      `${message || "Assertion failed"}\n   Expected: ${expectedStr}\n   Actual: ${actualStr}`,
    );
  }
}

function assertIncludes(str: string, substr: string, message?: string) {
  if (!str.includes(substr)) {
    throw new Error(
      `${message || "String does not include expected substring"}\n   Expected to include: "${substr}"\n   Actual: "${str}"`,
    );
  }
}

function assertNotIncludes(str: string, substr: string, message?: string) {
  if (str.includes(substr)) {
    throw new Error(
      `${message || "String includes unexpected substring"}\n   Expected NOT to include: "${substr}"\n   Actual: "${str}"`,
    );
  }
}

// ============================================================================
// Tests: isLocalImport
// ============================================================================

console.log("\n📦 Testing isLocalImport\n");

test("isLocalImport: relative path with ./", () => {
  assertEqual(isLocalImport("./foo"), true);
});

test("isLocalImport: relative path with ../", () => {
  assertEqual(isLocalImport("../bar"), true);
});

test("isLocalImport: absolute path", () => {
  assertEqual(isLocalImport("/absolute/path"), true);
});

test("isLocalImport: package name", () => {
  assertEqual(isLocalImport("lodash"), false);
});

test("isLocalImport: scoped package", () => {
  assertEqual(isLocalImport("@warlock.js/core"), false);
});

// ============================================================================
// Tests: parseImportSpecifier
// ============================================================================

console.log("\n📦 Testing parseImportSpecifier\n");

test("parseImportSpecifier: simple named import", () => {
  const result = parseImportSpecifier("{ foo }");
  assertEqual(result.bindings, [{ originalName: "foo", localName: "foo" }]);
  assertEqual(result.defaultImport, undefined);
  assertEqual(result.namespaceImport, undefined);
});

test("parseImportSpecifier: multiple named imports", () => {
  const result = parseImportSpecifier("{ foo, bar, baz }");
  assertEqual(result.bindings.length, 3);
  assertEqual(result.bindings[0], { originalName: "foo", localName: "foo" });
  assertEqual(result.bindings[1], { originalName: "bar", localName: "bar" });
  assertEqual(result.bindings[2], { originalName: "baz", localName: "baz" });
});

test("parseImportSpecifier: renamed import with 'as'", () => {
  const result = parseImportSpecifier("{ foo as bar }");
  assertEqual(result.bindings, [{ originalName: "foo", localName: "bar" }]);
});

test("parseImportSpecifier: namespace import", () => {
  const result = parseImportSpecifier("* as Foo");
  assertEqual(result.namespaceImport, "Foo");
  assertEqual(result.bindings, []);
});

test("parseImportSpecifier: default import", () => {
  const result = parseImportSpecifier("Foo");
  assertEqual(result.defaultImport, "Foo");
  assertEqual(result.bindings, []);
});

test("parseImportSpecifier: mixed import (default + named)", () => {
  const result = parseImportSpecifier("Foo, { bar, baz }");
  assertEqual(result.defaultImport, "Foo");
  assertEqual(result.bindings.length, 2);
  assertEqual(result.bindings[0], { originalName: "bar", localName: "bar" });
});

// ============================================================================
// Tests: mergeBindings
// ============================================================================

console.log("\n📦 Testing mergeBindings\n");

test("mergeBindings: new binding added", () => {
  const group: ImportGroup = {
    cachePath: "test.js",
    bindings: [{ originalName: "foo", localName: "foo" }],
    matches: [],
  };

  const aliases = mergeBindings(group, [{ originalName: "bar", localName: "bar" }]);

  assertEqual(group.bindings.length, 2);
  assertEqual(aliases.length, 0);
});

test("mergeBindings: duplicate binding with same local name is deduplicated", () => {
  const group: ImportGroup = {
    cachePath: "test.js",
    bindings: [{ originalName: "foo", localName: "foo" }],
    matches: [],
  };

  const aliases = mergeBindings(group, [{ originalName: "foo", localName: "foo" }]);

  assertEqual(group.bindings.length, 1, "Should not add duplicate");
  assertEqual(aliases.length, 0);
});

test("mergeBindings: duplicate binding with different local name creates alias", () => {
  const group: ImportGroup = {
    cachePath: "test.js",
    bindings: [{ originalName: "foo", localName: "foo" }],
    matches: [],
  };

  const aliases = mergeBindings(group, [{ originalName: "foo", localName: "foo2" }]);

  assertEqual(group.bindings.length, 1, "Should not add duplicate binding");
  assertEqual(aliases.length, 1, "Should create alias");
  assertEqual(aliases[0], "const foo2 = foo;");
});

// ============================================================================
// Tests: buildGroupImportStatement
// ============================================================================

console.log("\n📦 Testing buildGroupImportStatement\n");

test("buildGroupImportStatement: named imports", () => {
  const group: ImportGroup = {
    cachePath: "src-foo.js",
    bindings: [{ originalName: "bar", localName: "bar" }],
    matches: [],
  };

  const result = buildGroupImportStatement(group);
  assertIncludes(result, 'await __import("./src-foo.js")');
  assertIncludes(result, "const { bar }");
});

test("buildGroupImportStatement: namespace import", () => {
  const group: ImportGroup = {
    cachePath: "src-foo.js",
    bindings: [],
    namespaceImport: "Foo",
    matches: [],
  };

  const result = buildGroupImportStatement(group);
  assertEqual(result, 'const Foo = await __import("./src-foo.js")');
});

test("buildGroupImportStatement: default import", () => {
  const group: ImportGroup = {
    cachePath: "src-foo.js",
    bindings: [],
    defaultImport: "Foo",
    matches: [],
  };

  const result = buildGroupImportStatement(group);
  assertIncludes(result, 'await __import("./src-foo.js")');
  assertIncludes(result, "?.default ?? ");
});

// ============================================================================
// Tests: deduplicateImports (Integration)
// ============================================================================

console.log("\n📦 Testing deduplicateImports (Integration)\n");

test("deduplicateImports: simple single import", () => {
  const code = `import { foo } from "./bar";
console.log(foo);`;

  const resolver = (path: string) => (path === "./bar" ? "src-bar.js" : null);
  const result = deduplicateImports(code, resolver);

  assertIncludes(result.code, 'await __import("./src-bar.js")');
  assertNotIncludes(result.code, "import { foo }");
  assertEqual(result.unresolvedImports.length, 0);
});

test("deduplicateImports: duplicate imports to same module are deduplicated", () => {
  const code = `import { foo } from "./bar";
import { foo as foo2 } from "./bar";
console.log(foo, foo2);`;

  const resolver = (path: string) => (path === "./bar" ? "src-bar.js" : null);
  const result = deduplicateImports(code, resolver);

  // Should have only ONE __import call
  const importCount = (result.code.match(/await __import/g) || []).length;
  assertEqual(importCount, 1, "Should have exactly one __import call");

  // Should have alias assignment
  assertIncludes(result.code, "const foo2 = foo;");
  assertEqual(result.aliasAssignments.length, 1);
});

test("deduplicateImports: multiple imports from different modules", () => {
  const code = `import { a } from "./moduleA";
import { b } from "./moduleB";
console.log(a, b);`;

  const resolver = (path: string) => {
    if (path === "./moduleA") return "src-moduleA.js";
    if (path === "./moduleB") return "src-moduleB.js";
    return null;
  };

  const result = deduplicateImports(code, resolver);

  const importCount = (result.code.match(/await __import/g) || []).length;
  assertEqual(importCount, 2, "Should have two __import calls (one per module)");
});

test("deduplicateImports: external packages are NOT transformed", () => {
  const code = `import { foo } from "lodash";
import { bar } from "./local";
console.log(foo, bar);`;

  const resolver = (path: string) => (path === "./local" ? "src-local.js" : null);
  const result = deduplicateImports(code, resolver);

  // Lodash import should remain unchanged
  assertIncludes(result.code, 'import { foo } from "lodash"');
  // Local import should be transformed
  assertIncludes(result.code, 'await __import("./src-local.js")');
});

test("deduplicateImports: THE REAL BUG CASE - export + import pattern", () => {
  // This is the actual pattern that caused the bug:
  // export { X } from and import { X } from the same module
  // After esbuild, this becomes two imports with aliases
  const code = `import { AIError } from "./ai-error";
import { AIError as AIError2 } from "./ai-error";
function isAIError(error) {
  return error instanceof AIError2;
}
export { AIError };`;

  const resolver = (path: string) =>
    path === "./ai-error" ? "src-app-ai-errors-ai-error.js" : null;

  const result = deduplicateImports(code, resolver);

  console.log("\n--- Transformed Code ---");
  console.log(result.code);
  console.log("--- End ---\n");

  // Should have only ONE __import call
  const importCount = (result.code.match(/await __import/g) || []).length;
  assertEqual(importCount, 1, "Should have exactly one __import call");

  // Should create alias for AIError2 -> AIError
  assertIncludes(result.code, "const AIError2 = AIError;");

  // instanceof should use AIError2 (the alias)
  assertIncludes(result.code, "instanceof AIError2");

  // Export should still reference AIError
  assertIncludes(result.code, "export { AIError }");
});

// ============================================================================
// Summary
// ============================================================================

console.log("\n" + "=".repeat(50));
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
console.log("=".repeat(50) + "\n");

process.exit(failed > 0 ? 1 : 0);
