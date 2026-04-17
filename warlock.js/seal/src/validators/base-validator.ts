import { clone } from "@mongez/reinforcements";
import { validate } from "../factory/validate";
import { VALID_RULE, invalidRule } from "../helpers";
import { isEmptyValue } from "../helpers/is-empty-value";
import { requiredRule as defaultRequiredRule } from "../rules/core/required";
import type { JsonSchemaResult, JsonSchemaTarget } from "../standard-schema/json-schema";
import { mapToStandardResult } from "../standard-schema/map-result";
import type { StandardJSONSchemaV1, StandardSchemaV1 } from "../standard-schema/types";
import type {
  ContextualSchemaRule,
  ContextualizedMutator,
  ContextualizedTransformer,
  Mutator,
  SchemaContext,
  SchemaRule,
  SchemaRuleOptions,
  SimpleTransformerCallback,
  TransformerCallback,
  ValidationAttributesList,
  ValidationResult,
} from "../types";

/**
 * Base validator class - foundation for all validators
 */
export class BaseValidator<TInput = unknown, TOutput = TInput> {
  public rules: ContextualSchemaRule[] = [];
  public mutators: ContextualizedMutator[] = [];
  protected defaultValue: any | (() => any);
  protected description?: string;
  protected shouldOmit = false;
  protected isNullable = false;
  protected isMutable = false;

  /**
   * Whether the field is optional.
   * - false (default): field is required unless a requiredRule governs the condition.
   * - true: field can be absent or empty — set by calling .optional().
   *
   * Also used as a TypeScript literal brand via the optional() return type.
   */
  public isOptional = false;

  /**
   * The single required-condition rule for this field.
   * - null: field uses strict default (always required when not optional).
   * - set: the rule governs when the field is required (e.g., requiredIf).
   *
   * Stored separately from rules[] and prepended at validate() time.
   */
  public requiredRule: ContextualSchemaRule | null = this.createRule(defaultRequiredRule);

  /**
   * Pipeline to transform the mutated/original data before returning it
   */
  protected dataTransformers: ContextualizedTransformer[] = [];

  /**
   * Attributes text to be replaced on translations
   * If the value is an object, it will be used as the attributes list for the rule
   * If the value is a string, it will be used as the attributes list for the rule
   */
  protected attributesText: ValidationAttributesList = {};

  /**
   * Attributed that will be always using the attribute translator
   */
  protected translatedAttributes: Record<string, string> = {};

  /**
   * Mark the validator as mutable
   */
  public get mutable() {
    this.isMutable = true;
    return this;
  }

  /**
   * Mark the validator as immutable
   */
  public get immutable() {
    this.isMutable = false;
    return this;
  }

  /**
   * Get the instance to apply changes to.
   * By default (immutable), returns a clone so the original is unchanged.
   * When `.mutable` is set, returns `this` to mutate in place.
   */
  protected get instance(): this {
    return this.isMutable ? this : this.clone();
  }

  /**
   * Get the default value
   * Supports lazy evaluation via callbacks
   */
  public getDefaultValue(): any {
    return typeof this.defaultValue === "function" ? this.defaultValue() : this.defaultValue;
  }

  /**
   * Determine if value accepts null value
   */
  public nullable(): this {
    const instance = this.instance;
    instance.isNullable = true;
    return instance;
  }

  /**
   * Explicitly disallow null values after calling nullable
   */
  public notNullable(): this {
    const instance = this.instance;
    instance.isNullable = false;
    return instance;
  }

  /**
   * Add transformer with optional options
   *
   * @param transform - The transformer callback function
   * @param options - Optional options to pass to the transformer
   *
   * @example
   * ```ts
   * // Without options
   * v.date().addTransformer(data => data.toISOString())
   *
   * // With options
   * v.date().addTransformer(
   *   (data, { options }) => dayjs(data).format(options.format),
   *   { format: 'YYYY-MM-DD' }
   * )
   * ```
   */
  public addTransformer(transform: TransformerCallback, options: any = {}) {
    const instance = this.instance;
    instance.addMutableTransformer(transform, options);

    return instance;
  }

  /**
   * Add transformer with optional options
   *
   * @param transform - The transformer callback function
   * @param options - Optional options to pass to the transformer
   *
   * @example
   * ```ts
   * // Without options
   * v.date().addTransformer(data => data.toISOString())
   *
   * // With options
   * v.date().addTransformer(
   *   (data, { options }) => dayjs(data).format(options.format),
   *   { format: 'YYYY-MM-DD' }
   * )
   * ```
   */
  public addMutableTransformer(transform: TransformerCallback, options: any = {}) {
    this.dataTransformers.push({
      transform,
      options,
    });
  }

  /**
   * Transform the output value - simple one-time transformation
   *
   * @param callback - Simple callback receiving data and context
   *
   * @example
   * ```ts
   * // Simple transformation
   * v.string().outputAs(data => data.toUpperCase())
   *
   * // With context
   * v.string().outputAs((data, context) => {
   *   console.log(`Transforming ${context.path}`);
   *   return data.toLowerCase();
   * })
   * ```
   */
  public outputAs(callback: SimpleTransformerCallback) {
    return this.addTransformer((data, { context }) => callback(data, context));
  }

  /**
   * Transform output to JSON string
   *
   * Works with any validator type (string, number, date, object, array, etc.)
   *
   * @param indent - Optional indentation for pretty printing (default: 0 for compact)
   *
   * @example
   * ```ts
   * // Compact JSON
   * v.object({ name: v.string() }).toJSON()
   * // Output: '{"name":"John"}'
   *
   * // Pretty-printed JSON
   * v.array(v.object({...})).toJSON(2)
   * // Output:
   * // [
   * //   {
   * //     "name": "John"
   * //   }
   * // ]
   *
   * // Works with any type
   * v.string().toJSON()  // '"hello"'
   * v.number().toJSON()  // '42'
   * v.date().toJSON()    // '"2024-10-26T00:00:00.000Z"'
   * ```
   *
   * @category Transformer
   */
  public toJSON(indent?: number) {
    return this.addTransformer((data, { options }) => JSON.stringify(data, null, options.indent), {
      indent: indent ?? 0,
    });
  }

  /**
   * Start data transformation pipeline
   * Context is passed at runtime, not stored
   */
  public async startTransformationPipeline(data: any, context: SchemaContext) {
    for (const transformer of this.dataTransformers) {
      data = await transformer.transform(data, {
        options: transformer.options,
        context,
      });
    }

    return data;
  }

  /**
   * Set attributes text to be replaced on translations
   * If the value is an object, it will be used as the attributes list for the rule
   * If the value is a string, it will be used as the attributes list for the rule
   *
   * @example
   * v.string().attributes({
   *   name: "Name",
   *   email: "Email",
   * });
   * // Example 2: Add custom attributes for matches
   * v.string().matches("confirmPassword").attributes({
   *   matches: {
   *     confirmPassword: "Confirm Password",
   *   },
   * });
   */
  public attributes(attributes: Record<string, string | Record<string, string>>) {
    const instance = this.instance;
    for (const key in attributes) {
      instance.attributesText[key] = attributes[key];
    }

    return instance;
  }

  /**
   * Define a lazy getter property for each attribute in the given object and use the config attribute translator
   */
  public transAttributes(attributes: Record<string, string>) {
    const instance = this.instance;
    for (const key in attributes) {
      instance.translatedAttributes[key] = attributes[key];
    }

    return instance;
  }

  /**
   * Add description to the validator
   */
  public describe(description: string) {
    const instance = this.instance;
    instance.description = description;
    return instance;
  }

  /**
   * Check if this validator can handle the given value's type
   * Override this in specific validators to enable type-based routing in union validators
   *
   * Default: returns true (validator will attempt to validate any type)
   *
   * @param value - The value to check
   * @returns True if this validator can handle this type
   *
   * @example
   * ```ts
   * // StringValidator
   * public matchesType(value: any): boolean {
   *   return typeof value === 'string';
   * }
   *
   * // Custom FileValidator
   * public matchesType(value: any): boolean {
   *   return value instanceof UploadedFile;
   * }
   * ```
   */
  public matchesType(_value: any): boolean {
    return true; // Default: permissive, attempt to validate any type
  }

  /**
   * Create a copy of this validator with the same configuration
   * Copies all rules, mutators, transformers, default values, and settings
   *
   * @returns A new validator instance with copied configuration
   *
   * @example
   * ```ts
   * // Create reusable validator templates
   * const baseString = v.string().required().trim().min(3);
   * const emailField = baseString.clone().email();
   * const usernameField = baseString.clone().alphanumeric().max(20);
   *
   * // Works with all validators
   * const positiveInt = v.int().positive().required();
   * const ageField = positiveInt.clone().min(18).max(120);
   * ```
   */
  public clone(): this {
    // Create a new instance using Object.create to preserve the prototype chain
    const Constructor = this.constructor as new (...args: any[]) => this;
    const cloned = Object.create(Constructor.prototype);

    // Copy all BaseValidator properties
    cloned.rules = [...this.rules];
    cloned.mutators = [...this.mutators];
    cloned.dataTransformers = [...this.dataTransformers];
    cloned.defaultValue = this.defaultValue;
    cloned.shouldOmit = this.shouldOmit;
    cloned.description = this.description;
    cloned.attributesText = { ...this.attributesText };
    cloned.isNullable = this.isNullable;
    cloned.isOptional = this.isOptional;
    cloned.requiredRule = this.requiredRule; // same reference is fine — rule is treated as immutable

    return cloned;
  }

  /**
   * @deprecated This method is no longer needed and does nothing.
   * Empty values are now automatically skipped for validation rules by default.
   * Only presence validators (required, present, etc.) will check empty values.
   * You can safely remove this call from your code.
   */
  public ignoreEmptyValue(_ignoreEmptyValue = true) {
    // No-op for backward compatibility
    return this;
  }

  /**
   * Omit this field from the validated data output
   *
   * Field will still be validated but not included in the final result.
   * Useful for confirmation fields, captcha, terms acceptance, etc.
   *
   * @example
   * ```ts
   * v.object({
   *   password: v.string().required(),
   *   confirmPassword: v.string().required().sameAs("password").omit(),
   *   acceptTerms: v.boolean().required().omit(),
   * });
   * // Output: { password: "..." }
   * // confirmPassword and acceptTerms validated but omitted
   * ```
   */
  public omit() {
    const instance = this.instance;
    instance.shouldOmit = true;
    return instance;
  }

  /**
   * @alias omit
   */
  public exclude() {
    return this.omit();
  }

  /**
   * Check if this field should be omitted from the output
   */
  public isOmitted(): boolean {
    return this.shouldOmit;
  }

  /**
   * Add rule to the validator
   */
  public addRule<T extends SchemaRuleOptions = SchemaRuleOptions>(
    rule: SchemaRule<T>,
    errorMessage?: string,
    options: T = {} as T,
  ): this {
    const instance = this.instance;
    instance.addMutableRule(rule, errorMessage, options);
    return instance;
  }

  /**
   * Set the required-condition rule for this field.
   *
   * Unlike addRule(), this does NOT push to rules[]. The rule is stored in the
   * dedicated `requiredRule` slot and is prepended to the validation pipeline
   * at runtime. Only one required rule can be active per field — this replaces
   * any previously set required rule.
   *
   * Also marks the field as not optional (isOptional = false).
   *
   * @example
   * ```ts
   * // Used internally by required(), requiredIf(), requiredWith(), etc.
   * BaseValidator.prototype.required = function(msg) {
   *   return this.setRequiredRule(requiredRule, msg);
   * };
   * ```
   */
  public setRequiredRule<T extends SchemaRuleOptions = SchemaRuleOptions>(
    rule: SchemaRule<T>,
    errorMessage?: string,
    options: T = {} as T,
  ): this {
    const instance = this.instance;
    instance.isOptional = false;
    instance.requiredRule = instance.createRule(rule, errorMessage, options);
    return instance;
  }

  /**
   * Add mutable rule
   */
  public addMutableRule<T extends SchemaRuleOptions = SchemaRuleOptions>(
    rule: SchemaRule<T>,
    errorMessage?: string,
    options: T = {} as T,
  ): ContextualSchemaRule<T> {
    const newRule: ContextualSchemaRule<T> = this.createRule(rule, errorMessage, options);

    this.rules.push(newRule);

    return newRule;
  }

  /**
   * Create new rule
   */
  protected createRule<T extends SchemaRuleOptions = SchemaRuleOptions>(
    rule: SchemaRule<T>,
    errorMessage?: string,
    options: T = {} as T,
  ): ContextualSchemaRule<T> {
    const newRule: ContextualSchemaRule<T> = {
      ...(clone(rule) as ContextualSchemaRule<T>),
      context: {
        errorMessage,
        options,
        attributesList: this.attributesText,
        translatedAttributes: this.translatedAttributes,
        translationParams: {},
        translatableParams: {},
      },
    };

    if (errorMessage) {
      newRule.errorMessage = errorMessage;
    }

    if (rule.sortOrder === undefined) {
      newRule.sortOrder = this.rules.length + 1;
    }

    return newRule;
  }

  /**
   * Use a custom or pre-built validation rule
   *
   * @param rule - The validation rule to apply
   * @param options - Rule options including errorMessage and any rule-specific options
   *
   * @example
   * ```ts
   * import { hexColorRule } from "@warlock.js/seal";
   *
   * v.string().useRule(hexColorRule, { errorMessage: "Invalid color" });
   * ```
   *
   * @example
   * ```ts
   * // With rule options
   * v.string().useRule(myCustomRule, {
   *   customOption: true,
   *   errorMessage: "Custom validation failed"
   * });
   * ```
   */
  public useRule<T extends SchemaRuleOptions = SchemaRuleOptions>(
    rule: SchemaRule<T>,
    options?: T & { errorMessage?: string },
  ) {
    const { errorMessage, ...ruleOptions } = options || ({} as any);
    return this.addRule(rule, errorMessage, ruleOptions);
  }

  /**
   * Define custom rule
   */
  public refine(
    callback: (
      value: any,
      context: SchemaContext,
    ) => Promise<string | undefined> | string | undefined,
  ) {
    return this.addRule({
      name: "custom",
      async validate(value, context) {
        const result = await callback(value, context);
        if (result) {
          this.context.errorMessage = result;
          return invalidRule(this, context);
        }
        return VALID_RULE;
      },
    });
  }

  /**
   * Add mutator to the validator
   */
  public addMutator(mutator: Mutator, options: any = {}) {
    const instance = this.instance;
    instance.addMutableMutator(mutator, options);
    return instance;
  }

  /**
   * Add mutable mutator
   */
  public addMutableMutator(mutator: Mutator, options: any = {}) {
    this.mutators.push({
      mutate: mutator,
      context: {
        options,
        ctx: {} as any,
      },
    });
  }

  /**
   * Set default value for the field
   */
  public default(value: any) {
    const instance = this.instance;
    instance.defaultValue = value;
    return instance;
  }

  /**
   * Mutate the data
   */
  public async mutate(data: any, context: SchemaContext) {
    let mutatedData = data;

    for (const mutator of this.mutators) {
      mutator.context.ctx = context;
      mutatedData = await mutator.mutate(mutatedData, mutator.context);
    }

    return mutatedData;
  }

  /**
   * Set the label for the validator that will be matching the :input attribute
   */
  public label(label: string) {
    const instance = this.instance;
    instance.attributesText.input = label;
    return instance;
  }

  /**
   * Validate the data
   */
  public async validate(data: any, context: SchemaContext): Promise<ValidationResult> {
    if (data === null && this.isNullable) {
      return { isValid: true, errors: [], data: null };
    }

    const valueForRules = data ?? this.getDefaultValue();
    const mutatedData = await this.mutate(valueForRules, context);

    const errors: ValidationResult["errors"] = [];
    let isValid = true;
    const isFirstErrorOnly = context.configurations?.firstErrorOnly ?? true;

    const isEmpty = isEmptyValue(valueForRules);

    // Prepend the required-condition rule if set, so it always runs first.
    // requiredRule has requiresValue = false so it runs even on empty values.
    const rulesToRun = this.requiredRule ? [this.requiredRule, ...this.rules] : this.rules;

    for (const rule of rulesToRun) {
      if ((rule.requiresValue ?? true) && isEmpty) continue;

      this.setRuleAttributesList(rule);

      const result = await rule.validate(mutatedData, context);

      if (result.isValid === false) {
        isValid = false;
        errors.push({
          type: rule.name,
          error: result.error,
          input: result.path ?? context.path,
        });

        if (isFirstErrorOnly) {
          break;
        }
      }
    }

    return {
      isValid,
      errors,
      data:
        mutatedData !== undefined
          ? await this.startTransformationPipeline(mutatedData, context)
          : undefined,
    };
  }

  /**
   * Set rule attributes list
   */
  protected setRuleAttributesList(rule: ContextualSchemaRule) {
    rule.context.attributesList =
      typeof this.attributesText[rule.name] === "object"
        ? (this.attributesText[rule.name] as ValidationAttributesList)
        : this.attributesText;
  }

  /**
   * Standard Schema V1 compliance.
   *
   * Allows this validator to be used with any Standard Schema-aware library
   * (OpenAI structured outputs, LangGraph, TanStack Form, Conform, Valibot adapters, etc.)
   * without extra adapters.
   *
   * Delegates to the `validate()` factory so all `configureSeal()` options
   * (translations, firstErrorOnly) are picked up automatically at call time.
   *
   * Includes Standard JSON Schema support via `jsonSchema.input()` / `jsonSchema.output()`.
   *
   * ## How Standard Schema libraries consume this
   *
   * You pass the **schema object itself** to the library — they internally read
   * `schema["~standard"]`. Do NOT pass `schema["~standard"]` directly.
   *
   * @example
   * ```ts
   * const schema = v.object({ name: v.string().required() });
   *
   * // TanStack Form — pass schema, library reads ["~standard"] internally
   * const form = useForm({ validators: { onChange: schema } });
   *
   * // Conform (Remix) — same pattern
   * const [form] = useForm({ onValidate({ formData }) {
   *   return parseWithStandardSchema(formData, { schema });
   * }});
   *
   * // Direct validation (lower level — most apps don't need this)
   * const result = await schema["~standard"].validate({ name: "Hasan" });
   * // → { value: { name: "Hasan" } }  on success
   * // → { issues: [{ message: "...", path: [{ key: "name" }] }] }  on failure
   *
   * // JSON Schema for OpenAI / LangChain tool calling
   * const parameters = schema["~standard"].jsonSchema.input({ target: "openai-strict" });
   * // → { type: "object", properties: {...}, required: [...], additionalProperties: false }
   * ```
   *
   * @note Cross-field rules (sameAs, requiredIf, requiredWith) rely on sibling values
   * available in the full validation context. When called on a standalone scalar validator,
   * sibling data is absent and those rules will not evaluate correctly.
   * Always call on the parent ObjectValidator for full-payload validation.
   */
  get ["~standard"](): StandardJSONSchemaV1.Props<TInput, TOutput> {
    return {
      version: 1,
      vendor: "seal",
      types: undefined as unknown as StandardSchemaV1.Types<TInput, TOutput>,
      validate: async (value: unknown) => {
        const result = await validate(this, value);
        return mapToStandardResult(result) as StandardSchemaV1.Result<TOutput>;
      },
      jsonSchema: {
        input: (options) => this.toJsonSchema(options.target),
        output: (options) => this.toJsonSchema(options.target),
      },
    };
  }

  /**
   * Generate a JSON Schema representation of this validator.
   *
   * Supports targets: `"draft-2020-12"` (default), `"draft-07"`, `"openapi-3.0"`.
   *
   * Subclasses override this to describe their specific constraints.
   * The base implementation returns `{}` (permissive — accepts anything),
   * which is correct for validators with no representable JSON Schema constraints.
   *
   * @note Rules that cannot be expressed in JSON Schema are silently omitted:
   * - Cross-field rules: sameAs, requiredIf, requiredWith, requiredWithout
   * - Custom callbacks: refine()
   * - Framework-specific runtime rules (core/cascade plugins)
   * These rules still run normally at validation time — only absent from JSON Schema.
   *
   * @example
   * ```ts
   * v.string().min(3).max(50).toJsonSchema("draft-2020-12")
   * // → { type: "string", minLength: 3, maxLength: 50 }
   *
   * v.object({ name: v.string().required(), age: v.int().optional() })
   *   .toJsonSchema("draft-07")
   * // → { type: "object", properties: { name: { type: "string" }, age: { type: "integer" } }, required: ["name"] }
   * ```
   */
  public toJsonSchema(_target: JsonSchemaTarget = "draft-2020-12"): JsonSchemaResult {
    return {};
  }
}
