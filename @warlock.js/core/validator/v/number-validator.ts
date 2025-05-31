import { MaxRule, MinRule, NumberRule } from "./../rules";
import { BaseValidator } from "./base-validator";

export class NumberValidator extends BaseValidator {
  /**
   * Validator name
   */
  public name = "number";

  /**
   * Base rule
   */
  protected baseRule = new NumberRule();

  /**
   * Check if value matches the given min value
   */
  public min(length: number, errorMessage?: string) {
    return this.addRule({
      rule: new MinRule().setOptions([length]),
      errorMessage,
    });
  }

  /**
   * Check if value matches the given max value
   */
  public max(length: number, errorMessage?: string) {
    return this.addRule({
      rule: new MaxRule().setOptions([length]),
      errorMessage,
    });
  }
}
