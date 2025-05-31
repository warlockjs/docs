import type { UploadedFile } from "./../../http/UploadedFile";
import { Rule } from "./rule";

export class FileRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "file";

  /**
   * Validate the rule
   */
  public async validate() {
    let value: UploadedFile | UploadedFile[] | undefined = this.request.file(
      this.input,
    );

    if (!value) {
      value = this.request.files(this.input);
    }

    this.value = value;

    this.isValid = Array.isArray(this.value)
      ? this.value.length > 0
      : Boolean(this.value);

    if (!this.isValid) {
      this.isValid = this.request.files(this.input).length > 0;
    }
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("file");
  }

  /**
   * {@inheritDoc}
   */
  public expectedType() {
    return "file";
  }
}
