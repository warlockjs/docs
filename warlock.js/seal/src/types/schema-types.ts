import type { BaseValidator } from "../validators/base-validator";

/**
 * Schema definition - a record of validators
 */
export type Schema = Record<string, BaseValidator>;
