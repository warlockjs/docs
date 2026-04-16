# Documentation Audit: @warlock.js/seal

Status: ⚠️ NEEDS_REVIEW  
Coverage: ~70% (Main validators good, Composition & Advanced validators missing)

## Audit Results

| File | Status | Notes |
|------|--------|-------|
| `getting-started/introduction.mdx` | ✅ OK | Good overview of the 3-layer architecture. |
| `concepts/three-layer-architecture.mdx` | ✅ OK | High quality explanation of Mutators, Validators, Transformers. |
| `concepts/type-inference.mdx` | ⚠️ NEEDS_REVIEW | Contains incorrect spread syntax example for extending schemas. Use `.extend()` instead. |
| `concepts/validation-flow.mdx` | ✅ OK | Good visual flow explanation. |
| `concepts/error-messages.mdx` | ✅ OK | Clear examples of custom messages and labels. |
| `string-validator/*` | ✅ OK | Very detailed, 68+ methods covered with examples. |
| `number-validator/*` | ✅ OK | Good coverage of ranges and sign validation. |
| `date-validator/*` | ✅ OK | Massive and comprehensive coverage (23KB of docs). |
| `object-validator/*` | ⚠️ NEEDS_REVIEW | **Critical Missing**: No documentation for `extend()`, `merge()`, `pick()`, `partial()`, `without()`. |
| `array-validator/*` | ✅ OK | Good coverage of sorting and uniqueness. |
| `any-validator/index.mdx` | ✅ OK | Proper explanation of the catch-all validator. |

## 🚨 Critical Gaps (Missing Documentation)

The following validators exist in the source code but have **ZERO** documentation in the `docs/seal` directory:

1.  **Record Validator** (`v.record()`): For objects with dynamic keys but consistent value types.
2.  **Tuple Validator** (`v.tuple()`): Fixed-length arrays with position-specific types.
3.  **Union Validator** (`v.union()`): Validates against multiple possible types (OR logic).
4.  **Computed Fields** (`v.computed()`): Deriving values during validation.
5.  **Managed Fields** (`v.managed()`): Injected values by the framework.
6.  **Lazy/Recursive Validation** (`v.lazy()`, `v.recursive()`): For circular references.

## ⚠️ Issues & Recommendations

### 1. Schema Composition (ObjectValidator)
- **Problem**: The powerhouse methods of `ObjectValidator` (`extend`, `merge`, `pick`, `without`) are completely missing from the docs.
- **Recommendation**: Create a `composition.mdx` or add these to `object-validator/index.mdx`. These are a key value prop for Seal.

### 2. Type Inference Spreading
- **Problem**: `type-inference.mdx` shows `{ ...baseSchema, ... }`.
- **Correction**: Seal validators are class instances, spreading them doesn't merge the internal schema metadata correctly. The documentation MUST emphasize using `.extend()` or `.merge()`.

### 3. File Validation Location
- **Problem**: `v.file()` and `v.files()` are provided by `@warlock.js/core` but are often expected in Seal docs.
- **Recommendation**: Add a placeholder/stub in Seal docs pointing to the Core documentation for file validation when used within Warlock.

### 4. Method Count Accuracy
- **Problem**: `string-validator/index.mdx` claims 68 methods. While probably close, any future additions will make this number stale.
- **Recommendation**: Use less specific phrasing like "Over 60 methods" or ensure a script updates this number.

### 5. Advanced Validators
- **Recommendation**: Create a new category "Advanced Validators" for Record, Tuple, Union, and Computed fields. These are essential for complex APIs.
