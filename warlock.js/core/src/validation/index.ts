/**
 * Framework Validator - Framework-Specific Rules and Validators
 *
 * This package contains all framework-specific validation functionality:
 * - FileValidator (requires UploadedFile)
 * - Database validation rules (requires Cascade ORM)
 * - Upload validation rules (requires Upload model)
 *
 * Import from: @warlock.js/core/v
 */

// Export types (includes type augmentations)
export * from "./types";

// Framework-specific validators
export * from "./validators";

// Database validation rules
export * from "./database";

// File upload validation rules
export * from "./file";

export { v, type Infer } from "@warlock.js/seal";
