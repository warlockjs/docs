import { type GenericObject } from "@mongez/reinforcements";
import { ObjectRule } from "./../rules";
import { BaseValidator } from "./base-validator";

export class ObjectValidator extends BaseValidator {
  /**
   * Validator name
   */
  public name = "object";

  /**
   * Base rule
   */
  protected baseRule = new ObjectRule();

  /**
   * Whether to allow unknown keys
   */
  protected allowUnknownKeys = false;

  /**
   * Whether to allow unknown keys
   */
  public unknown(allow = true) {
    this.allowUnknownKeys = allow;
    return this;
  }

  /**
   * Allow unknown keys
   *
   * @alias unknown(true)
   */
  public allowUnknown() {
    return this.unknown(true);
  }

  /**
   * Set object validation
   */
  public setObject(object: GenericObject<BaseValidator>) {
    this.configurations.object = object;
    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async validate() {
    this.prepareErrorsList();

    await super.validate();

    if (this.fails) return;

    const object = this.configurations.object;

    if (this.allowUnknownKeys === false) {
      for (const key in this.value) {
        if (!object[key]) {
          this.addError(
            "unknownKey",
            this.request.t("validation.unknownKey", { key }),
          );
        }
      }
    }

    if (this.fails) return;

    // before validating the object, we need to make sure first is the object itself is required or not
    if (this.isEmptyValue) {
      return;
    }

    for (const key in object) {
      const validator = object[key];
      const value = this.value[key];

      await validator
        .clone()
        .setRequest(this.request)
        .setNamespaceKey(this.fullKey)
        .setValue(value)
        .setKey(key)
        .setErrorsListRef(this.errorsList)
        .validate();
    }
  }

  protected prepareErrorsList() {
    if (!this.errorsList) {
      this.errorsList = [];
    }

    return this.errorsList;
  }
}
