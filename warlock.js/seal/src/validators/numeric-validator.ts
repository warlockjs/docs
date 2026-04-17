import { isNumeric } from "@mongez/supportive-is";
import { numericMutator } from "../mutators/number-mutators";
import { NumberValidator } from "./number-validator";

/**
 * Numeric validator class - base for Int and Float validators either as number or string
 */
export class NumericValidator extends NumberValidator {
  /**
   * Constructor
   */
  public constructor(errorMessage?: string) {
    super(errorMessage);
    this.addMutableMutator(numericMutator);
  }

  /**
   * Check if value is a numeric type
   */
  public matchesType(value: any): boolean {
    return isNumeric(value);
  }
}
