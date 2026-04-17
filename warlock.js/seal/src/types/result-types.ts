/**
 * Validation result
 */
export type ValidationResult = {
  /** Whether validation passed */
  isValid: boolean;
  /** Validated and potentially mutated data */
  data: any;
  /** List of validation errors */
  errors: {
    /** Rule type that failed */
    type: string;
    /** Error message */
    error: string;
    /** Input field name */
    input: string;
  }[];
};
