import config from "@mongez/config";
import { isEmpty } from "@mongez/supportive-is";
import { type Request } from "./../../http";
import { RequiredRule, type Rule } from "./../rules";

export type ValidationRule = {
  rule: Rule;
  errorMessage?: string;
  translatable?: boolean;
  order?: number;
};

export abstract class BaseValidator {
  /**
   * Input value
   */
  public value: any;

  /**
   * Errors list
   */
  protected errorsList!: any[];

  /**
   * Input key
   * This is the direct key of the input
   * For example, if the key is `user.name` then the key is `name`
   */
  public key = "";

  /**
   * Input namespace key
   * This is the parent key namespace
   * for example, if the key is `user.name` then namespace is `user`
   */
  public keyNamespace = "";

  /**
   * Rules list
   */
  public rules: ValidationRule[] = [];

  /**
   * Request handler
   */
  protected request!: Request;

  /**
   * Validator name
   */
  public abstract name: string;

  /**
   * Base rule
   */
  protected abstract baseRule: Rule;

  public configurations: any = {};

  /**
   * Set errors list ref
   */
  public setErrorsListRef(errorsList: any[]) {
    this.errorsList = errorsList;

    return this;
  }

  /**
   * Constructor
   */
  public constructor(public errorMessage?: string) {}

  /**
   * Init
   */
  protected init() {
    this.addRule({
      rule: this.baseRule,
      errorMessage: this.errorMessage,
      order: 1,
    });
  }

  /**
   * Set request
   */
  public setRequest(request: Request) {
    this.request = request;

    return this;
  }

  /**
   * Validate the value
   */
  public async validate() {
    this.init();

    // order rules first
    this.rules.sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const rule of this.rules) {
      const validationRule = rule.rule;

      if (validationRule.requiresValue && this.isEmptyValue) continue;

      await validationRule
        .setInput(this.fullKey)
        .setValue(this.value)
        .setRequest(this.request)
        .validate();

      if (validationRule.fails()) {
        this.addError(
          validationRule.getName(),
          rule.errorMessage || validationRule.error(),
        );

        break;
      }
    }
  }

  /**
   * Check if value is empty
   */
  public get isEmptyValue(): boolean {
    return isEmpty(this.value);
  }

  /**
   * Get full key
   */
  public get fullKey() {
    return this.keyNamespace ? `${this.keyNamespace}.${this.key}` : this.key;
  }

  /**
   * Add rule
   */
  public addRule(rule: ValidationRule) {
    if (!rule.order) {
      rule.order = this.rules.length + 1;
    }

    this.rules.push(rule);

    return this;
  }

  /**
   * Check if validator fails
   */
  public get fails() {
    return this.errorsList?.length > 0;
  }

  /**
   * Check if validator passes
   */
  public get passes() {
    return this.errorsList?.length === 0;
  }

  /**
   * Set input value
   */
  public setValue(value: any) {
    this.value = value;

    return this;
  }

  /**
   * Set input key
   */
  public setKey(key: string) {
    this.key = key;

    return this;
  }

  /**
   * Set input namespace key (key excluded)
   */
  public setNamespaceKey(key: string) {
    this.keyNamespace = key;

    return this;
  }

  /**
   * Add new error
   */
  public addError(rule: string, message: string) {
    const inputKey = config.get("validation.keys.inputKey", "input");
    const inputError = config.get("validation.keys.inputError", "error");

    this.errorsList.push({
      input: this.fullKey,
      [inputKey]: rule,
      [inputError]: message,
    });

    return this;
  }

  /**
   * Get errors list
   */
  public errors() {
    return this.errorsList;
  }

  /**
   * Make it required
   */
  public required(errorMessage?: string) {
    const requiredRule = new RequiredRule();

    this.addRule({
      rule: requiredRule,
      errorMessage,
      order: 0,
    });

    return this;
  }

  /**
   * Clone the validator
   */
  public clone(): BaseValidator {
    const validator = new (this.constructor as any)(this.errorMessage);

    validator.rules = this.rules;

    validator.configurations = { ...this.configurations };

    validator.errorsList = [];

    validator.baseRule = this.baseRule;

    return validator;
  }
}
