import type { UploadedFile } from "./../../http/UploadedFile";
import { Rule } from "./rule";

export class ImageRule extends Rule {
  /**
   * Rule name
   */
  public static ruleName = "image";

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
      ? this.value.length > 0 && this.value.every(file => file.isImage)
      : Boolean(this.value) && this.value.isImage;
  }

  /**
   * Get error message
   */
  public error() {
    return this.trans("image");
  }

  /**
   * {@inheritDoc}
   */
  public expectedType() {
    return "file";
  }
}
