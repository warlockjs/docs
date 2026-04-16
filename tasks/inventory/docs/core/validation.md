# @warlock.js/core Audit — Validation

**Status:** 🟢 Healthy (Minor Gaps)
**Corpus:** `src/validation/`

## Validation Coverage Map

| Feature | Inventory Signature | Documentation Coverage | Gap Status |
| :--- | :--- | :--- | :--- |
| **Object/Array/Tuple** | `v.object/array/tuple` | 100% | 🟢 Healthy |
| **File Validator** | `v.file()` fluent methods | 100% | 🟢 Healthy |
| **Unique/Exists Rules** | `unique/exists` and variants | 100% | 🟢 Healthy |
| **Conditional Rules** | `requiredIf/forbiddenIf` | 100% | 🟢 Healthy |
| **Localized Plugin** | `localizedPlugin` | 0% | 🔴 Silent |
| **Custom Validators** | `FileValidator` class extensibility | 20% | 🟡 Needs Depth |

---

## Technical Findings

### 1. Localized Validation (Silent API)
Warlock has a built-in `localized-plugin` for Seal that simplifies the validation of multilingual fields (e.g., validating that an object contains specific locale codes).
- **Gap**: Zero documentation. Developers building multilingual CMS features have no guidance on how to use `v.localized()` or the underlying plugin logic.

### 2. Manual Data Resolution
The `resolveDataToParse()` function is used internally to decide if `body`, `query`, or `params` should be validated.
- **Observation**: While largely internal, this is exported and could be useful for developers building custom validation middleware. It is currently silent.

### 3. FileValidator Depth
While the fluent methods (`image()`, `pdf()`, etc.) are well-documented, the ability to extend the `FileValidator` class for custom file-based rules is not covered. 

---

## Action Plan (Validation)
- [ ] Document the `localized()` validation rule and how it integrates with `AppConfigurations.localeCodes`.
- [ ] Add a section on "Advanced File Validation" covering how to extend `FileValidator`.
- [ ] Mention `resolveDataToParse()` in a "Low-level / Internal" guide.
