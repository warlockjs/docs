import { ArrayRule } from "./../rules";
import { BaseValidator } from "./base-validator";

export class ArrayValidator extends BaseValidator {
  /**
   * Validator name
   */
  public name = "array";

  /**
   * Base rule
   */
  protected baseRule = new ArrayRule();

  /**
   * Set object validation
   */
  public setObject(object: BaseValidator) {
    this.configurations.object = object;
    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async validate() {
    await super.validate();

    if (this.fails) return;

    // before validating the object, we need to make sure first is the array itself is required or not
    if (this.isEmptyValue) {
      return;
    }

    const object: BaseValidator = this.configurations.object;

    // now let's validate each item in the array
    for (let i = 0; i < this.value.length; i++) {
      const value = this.value[i];

      const clonedObject = object.clone();

      await clonedObject
        .setRequest(this.request)
        .setNamespaceKey(this.fullKey)
        .setKey(String(i))
        .setValue(value)
        .setErrorsListRef(this.errorsList)
        .validate();
    }
  }
}
