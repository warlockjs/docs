/**
 * Core Validators Export
 *
 * These validators are framework-agnostic and work with standard JavaScript types
 *
 * Note: FileValidator has been moved to framework-rules/validators
 * as it requires framework-specific UploadedFile functionality
 */

export * from "./any-validator";
export * from "./array-validator";
export * from "./base-validator";

// BaseValidator prototype augmentations — must come after base-validator export
// to ensure the class is fully initialized before augmentation
import "./methods/equality-conditional-methods";
import "./methods/forbidden-methods";
import "./methods/present-methods";
import "./methods/required-methods";

// Abstract intermediate bases — export after augmentations so prototype is ready
export * from "./primitive-validator";

export * from "./boolean-validator";
export * from "./computed-validator";
export * from "./date-validator";
export * from "./float-validator";
export * from "./int-validator";
export * from "./managed-validator";
export * from "./number-validator";
export * from "./numeric-validator";
export * from "./object-validator";
export * from "./record-validator";
export * from "./scalar-validator";
export * from "./string-validator";
export * from "./tuple-validator";
export * from "./union-validator";
