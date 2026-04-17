import { floatRule } from "../rules";
import { NumberValidator } from "./number-validator";

/**
 * Float validator class
 */
export class FloatValidator extends NumberValidator {
  public constructor(errorMessage?: string) {
    super();
    this.addMutableRule(floatRule, errorMessage);
  }
}
