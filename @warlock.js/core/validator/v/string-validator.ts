import {
  EmailRule,
  InRule,
  LengthRule,
  MaxLengthRule,
  MinLengthRule,
  PatternRule,
  StringRule,
  UrlRule,
} from "./../rules";
import { BaseValidator } from "./base-validator";

export class StringValidator extends BaseValidator {
  /**
   * Validator name
   */
  public name = "string";

  /**
   * Base rule
   */
  protected baseRule = new StringRule();

  /**
   * Check if value is in the given values
   */
  public in(values: string[], errorMessage?: string) {
    return this.addRule({
      rule: new InRule().setOptions(values),
      errorMessage,
    });
  }

  /**
   * Check if value is an email
   */
  public email(errorMessage?: string) {
    return this.addRule({
      rule: new EmailRule(),
      errorMessage,
    });
  }

  /**
   * Check if value is a url
   */
  public url(errorMessage?: string) {
    return this.addRule({
      rule: new UrlRule(),
      errorMessage,
    });
  }

  /**
   * Check if value matches the given pattern
   */
  public pattern(pattern: RegExp, errorMessage?: string) {
    return this.addRule({
      rule: new PatternRule(pattern),
      errorMessage,
    });
  }

  /**
   * Check if value matches the given min length
   */
  public minLength(length: number, errorMessage?: string) {
    return this.addRule({
      rule: new MinLengthRule().setOptions([length]),
      errorMessage,
    });
  }

  /**
   * Check if value matches the given max length
   */
  public maxLength(length: number, errorMessage?: string) {
    return this.addRule({
      rule: new MaxLengthRule().setOptions([length]),
      errorMessage,
    });
  }

  /**
   * Check if value matches the given length
   */
  public length(length: number, errorMessage?: string) {
    return this.addRule({
      rule: new LengthRule().setOptions([length]),
      errorMessage,
    });
  }
}
