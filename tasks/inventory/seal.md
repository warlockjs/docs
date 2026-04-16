# @warlock.js/seal — Inventory

## Package Info

- Version: 4.0.165
- Type: Standalone Package
- Dependencies: `@mongez/supportive-is`, `dayjs`

## Directory Tree

```
src/
├── config.ts
├── index.ts
├── factory/
│   ├── index.ts
│   ├── validate.ts
│   └── validators.ts
├── helpers/
│   ├── date-helpers.ts
│   ├── file.utils.ts
│   ├── get-field-value.ts
│   ├── index.ts
│   ├── is-empty-value.ts
│   ├── path-helpers.ts
│   └── validation-helpers.ts
├── mutators/
│   ├── index.ts
│   ├── array-mutators.ts
│   ├── date-mutators.ts
│   ├── number-mutators.ts
│   ├── object-mutators.ts
│   ├── scalar-mutators.ts
│   └── string-mutators.ts
├── plugins/
│   ├── index.ts
│   └── plugin-system.ts
├── rules/
│   ├── index.ts
│   ├── array/
│   ├── color/
│   ├── common/
│   ├── conditional/
│   ├── core/
│   ├── date/
│   ├── file/
│   ├── length/
│   ├── number/
│   ├── scalar/
│   └── string/
├── standard-schema/
│   ├── index.ts
│   ├── json-schema.ts
│   ├── map-result.ts
│   └── types.ts
├── types/
│   ├── conditional-types.ts
│   ├── context-types.ts
│   ├── data-transformer-types.ts
│   ├── date-types.ts
│   ├── file.types.ts
│   ├── index.ts
│   ├── inference-types.ts
│   ├── mutator-types.ts
│   ├── result-types.ts
│   ├── rule-types.ts
│   └── schema-types.ts
└── validators/
    ├── any-validator.ts
    ├── array-validator.ts
    ├── base-validator.ts
    ├── boolean-validator.ts
    ├── computed-validator.ts
    ├── date-validator.ts
    ├── float-validator.ts
    ├── index.ts
    ├── int-validator.ts
    ├── managed-validator.ts
    ├── methods/
    ├── number-validator.ts
    ├── numeric-validator.ts
    ├── object-validator.ts
    ├── primitive-validator.ts
    ├── record-validator.ts
    ├── scalar-validator.ts
    ├── string-validator.ts
    ├── tuple-validator.ts
    └── union-validator.ts
```

## Exports by File

### src/config.ts
*Global configuration for the Seal validation library.*

- **Type** `TranslateRuleCallback`
- **Type** `TranslateAttributeCallback`
- **Type** `SealConfig`
- **Function** `configureSeal(options: Partial<SealConfig>): void`
- **Function** `getSealConfig(): SealConfig`
- **Function** `resetSealConfig(): void`

### src/types/rule-types.ts
*Core contracts for validation rules and their results.*

- **Type** `RuleResult`
- **Type** `ValidationAttributesList`
- **Type** `SchemaRuleOptions`
- **Type** `SchemaRule`
- **Type** `ContextualSchemaRule`

### src/types/context-types.ts
*Context objects passed during validation cycles.*

- **Type** `RuleTranslation`
- **Type** `AttributeTranslation`
- **Type** `SchemaContext`

### src/types/inference-types.ts
*TypeScript utility for inferring output types from validators.*

- **Type** `Infer<T>`

### src/helpers/validation-helpers.ts
*Internal utilities for error message generation and translation.*

- **Constant** `VALID_RULE: RuleResult`
- **Function** `resolveTranslation(params: { ... }): string`
- **Function** `invalidRule(rule: ContextualSchemaRule, context: SchemaContext): RuleResult`

### src/helpers/get-field-value.ts
*Utility to extract values from global or sibling scopes.*

- **Function** `getFieldValue(rule: ContextualSchemaRule, context: SchemaContext, fieldKey?: string): any`

---

### src/factory/validators.ts
*The 'v' object used to create all validator instances.*
*Lines: 154*

- **Constant** `v: ValidatorV`
- **Interface** `ValidatorV`
  - `object`, `any`, `array`, `record`, `tuple`, `date`, `string`, `email`, `enum`, `number`, `numeric`, `int`, `float`, `boolean`, `scalar`, `union`, `computed`, `managed`, `validate`.

---

### src/validators/base-validator.ts
*The abstract base class for all validators.*
*Lines: 747*

- **Class** `BaseValidator<TInput = unknown, TOutput = TInput>`
  - `public rules: ContextualSchemaRule[]`
  - `public mutators: ContextualizedMutator[]`
  - `public isOptional: boolean`
  - `public requiredRule: ContextualSchemaRule | null`
  - `protected defaultValue: any | (() => any)`
  - `protected description?: string`
  - `protected shouldOmit: boolean`
  - `protected isNullable: boolean`
  - `protected isMutable: boolean`
  - `protected dataTransformers: ContextualizedTransformer[]`
  - `protected attributesText: ValidationAttributesList`
  - `protected translatedAttributes: Record<string, string>`
  - `public get mutable(): this`
  - `public get immutable(): this`
  - `protected get instance(): this`
  - `public getDefaultValue(): any`
  - `public nullable(): this`
  - `public notNullable(): this`
  - `public addTransformer(transform: TransformerCallback, options?: any): this`
  - `public addMutableTransformer(transform: TransformerCallback, options?: any): void`
  - `public outputAs(callback: SimpleTransformerCallback): this`
  - `public toJSON(indent?: number): this`
  - `public async startTransformationPipeline(data: any, context: SchemaContext): Promise<any>`
  - `public attributes(attributes: Record<string, string | Record<string, string>>): this`
  - `public transAttributes(attributes: Record<string, string>): this`
  - `public describe(description: string): this`
  - `public matchesType(_value: any): boolean`
  - `public clone(): this`
  - `public omit(): this`
  - `public exclude(): this`
  - `public isOmitted(): boolean`
  - `public addRule<T>(rule: SchemaRule<T>, errorMessage?: string, options?: T): this`
  - `public setRequiredRule<T>(rule: SchemaRule<T>, errorMessage?: string, options?: T): this`
  - `public addMutableRule<T>(rule: SchemaRule<T>, errorMessage?: string, options?: T): ContextualSchemaRule<T>`
  - `protected createRule<T>(rule: SchemaRule<T>, errorMessage?: string, options?: T): ContextualSchemaRule<T>`
  - `public useRule<T>(rule: SchemaRule<T>, options?: T & { errorMessage?: string }): this`
  - `public refine(callback: (value: any, context: SchemaContext) => ...): this`
  - `public addMutator(mutator: Mutator, options?: any): this`
  - `public addMutableMutator(mutator: Mutator, options?: any): void`
  - `public default(value: any): this`
  - `public async mutate(data: any, context: SchemaContext): Promise<any>`
  - `public label(label: string): this`
  - `public async validate(data: any, context: SchemaContext): Promise<ValidationResult>`
  - `protected setRuleAttributesList(rule: ContextualSchemaRule): void`
  - `get ["~standard"](): StandardJSONSchemaV1.Props<TInput, TOutput>`
  - `public toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`

### src/validators/primitive-validator.ts
*Base for single-value validators (string, number, boolean).*

- **Class** `PrimitiveValidator extends BaseValidator`
  - `public enum(values: any, errorMessage?: string): this`
  - `public in(values: any[], errorMessage?: string): this`
  - `public oneOf(values: any[], errorMessage?: string): this`
  - `public allowsOnly(values: any[], errorMessage?: string): this`
  - `public forbids(values: any[], errorMessage?: string): this`
  - `public notIn(values: any[], errorMessage?: string): this`

### src/validators/string-validator.ts
*Validator for string values with extensive text processing mutators and rules.*
*Lines: 532*

- **Class** `StringValidator extends PrimitiveValidator`
  - `public constructor(errorMessage?: string)`
  - `public matchesType(value: any): boolean`
  - `public toString(): this`
  - `public uppercase(): this`
  - `public lowercase(): this`
  - `public capitalize(): this`
  - `public titleCase(): this`
  - `public camelCase(): this`
  - `public pascalCase(): this`
  - `public snakeCase(): this`
  - `public kebabCase(): this`
  - `public trim(needle?: string): this`
  - `public ltrim(needle?: string): this`
  - `public rtrim(needle?: string): this`
  - `public trimMultipleWhitespace(): this`
  - `public padStart(length: number, char?: string): this`
  - `public padEnd(length: number, char?: string): this`
  - `public safeHtml(): this`
  - `public htmlEscape(): this`
  - `public unescapeHtml(): this`
  - `public removeSpecialCharacters(): this`
  - `public toAlpha(): this`
  - `public toAlphanumeric(): this`
  - `public removeNumbers(): this`
  - `public urlDecode(): this`
  - `public urlEncode(): this`
  - `public slug(): this`
  - `public base64Encode(): this`
  - `public base64Decode(): this`
  - `public replace(search: string | RegExp, replace: string): this`
  - `public replaceAll(search: string | RegExp, replace: string): this`
  - `public append(suffix: string): this`
  - `public prepend(prefix: string): this`
  - `public reverse(): this`
  - `public truncate(maxLength: number, suffix?: string): this`
  - `public repeat(count: number): this`
  - `public mask(start: number, end?: number, char?: string): this`
  - `public email(errorMessage?: string): this`
  - `public url(errorMessage?: string): this`
  - `public withoutWhitespace(errorMessage?: string): this`
  - `public pattern(pattern: RegExp, errorMessage?: string): this`
  - `public strongPassword(minLength?: number, errorMessage?: string): this`
  - `public words(words: number, errorMessage?: string): this`
  - `public minWords(words: number, errorMessage?: string): this`
  - `public maxWords(words: number, errorMessage?: string): this`
  - `public minLength(length: number, errorMessage?: string): this`
  - `public min(min: number, errorMessage?: string): this`
  - `public maxLength(length: number, errorMessage?: string): this`
  - `public max(max: number, errorMessage?: string): this`
  - `public length(length: number, errorMessage?: string): this`
  - `public lengthBetween(min: number, max: number, errorMessage?: string): this`
  - `public alpha(errorMessage?: string): this`
  - `public alphanumeric(errorMessage?: string): this`
  - `public numeric(errorMessage?: string): this`
  - `public startsWith(value: string, errorMessage?: string): this`
  - `public endsWith(value: string, errorMessage?: string): this`
  - `public contains(value: string, errorMessage?: string): this`
  - `public notContains(value: string, errorMessage?: string): this`
  - `public ip(errorMessage?: string): this`
  - `public ip4(errorMessage?: string): this`
  - `public ip6(errorMessage?: string): this`
  - `public creditCard(errorMessage?: string): this`
  - `public color(errorMessage?: string): this`
  - `public hexColor(errorMessage?: string): this`
  - `public hslColor(errorMessage?: string): this`
  - `public rgbColor(errorMessage?: string): this`
  - `public rgbaColor(errorMessage?: string): this`
  - `public lightColor(errorMessage?: string): this`
  - `public darkColor(errorMessage?: string): this`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`

### src/validators/number-validator.ts
*Validator for numeric values with arithmetic rules and rounding mutators.*
*Lines: 371*

- **Class** `NumberValidator extends PrimitiveValidator`
  - `public constructor(errorMessage?: string)`
  - `public matchesType(value: any): boolean`
  - `public min(min: number | string, errorMessage?: string): this`
  - `public max(max: number | string, errorMessage?: string): this`
  - `public minSibling(field: string, errorMessage?: string): this`
  - `public maxSibling(field: string, errorMessage?: string): this`
  - `public greaterThan(value: number | string, errorMessage?: string): this`
  - `public lessThan(value: number | string, errorMessage?: string): this`
  - `public gt(value: number | string, errorMessage?: string): this`
  - `public lt(value: number | string, errorMessage?: string): this`
  - `public greaterThanSibling(field: string, errorMessage?: string): this`
  - `public gtSibling(field: string, errorMessage?: string): this`
  - `public lessThanSibling(field: string, errorMessage?: string): this`
  - `public ltSibling(field: string, errorMessage?: string): this`
  - `public modulo(value: number, errorMessage?: string): this`
  - `public divisibleBy(value: number, errorMessage?: string): this`
  - `public multipleOf(value: number, errorMessage?: string): this`
  - `public modulusOf(value: number, errorMessage?: string): this`
  - `public positive(errorMessage?: string): this`
  - `public negative(errorMessage?: string): this`
  - `public odd(errorMessage?: string): this`
  - `public even(errorMessage?: string): this`
  - `public between(min: number | string, max: number | string, errorMessage?: string): this`
  - `public betweenSibling(minField: string, maxField: string, errorMessage?: string): this`
  - `public length(length: number, errorMessage?: string): this`
  - `public minLength(length: number, errorMessage?: string): this`
  - `public maxLength(length: number, errorMessage?: string): this`
  - `public abs(): this`
  - `public ceil(): this`
  - `public floor(): this`
  - `public round(decimals?: number): this`
  - `public toFixed(decimals?: number): this`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`
  - `protected buildNumberJsonSchema(type: "number" | "integer", target: JsonSchemaTarget): JsonSchemaResult`

### src/validators/object-validator.ts
*The core structural validator for objects with support for extending and picking.*
*Lines: 617*

- **Class** `ObjectValidator<TSchema extends Schema = Schema> extends BaseValidator`
  - `public schema: TSchema`
  - `protected shouldAllowUnknown: boolean`
  - `protected allowedKeys: string[]`
  - `protected hasUnknownKeyRule: boolean`
  - `public constructor(schema: TSchema, errorMessage?: string)`
  - `public matchesType(value: any): boolean`
  - `public stripUnknown(): this`
  - `public allow(...keys: string[]): this`
  - `public trim(recursive?: boolean): this`
  - `public allowUnknown(allow?: boolean): this`
  - `public override clone(keys?: string[]): this`
  - `public extend<T>(schemaOrValidator: T | ObjectValidator<T>): ObjectValidator<TSchema & T>`
  - `public merge<T>(validator: ObjectValidator<T>): ObjectValidator<TSchema & T>`
  - `public pick<K>(...keys: K[]): ObjectValidator<Pick<TSchema, K>>`
  - `public partial<K>(...keys: K[]): this`
  - `public requiredFields<K>(...keys: K[]): this`
  - `public without<K>(...keys: K[]): ObjectValidator<Omit<TSchema, K>>`
  - `public mutate(data: any, context: SchemaContext): Promise<any>`
  - `public async validate(data: any, context: SchemaContext): Promise<ValidationResult>`
  - `private isComputedValidator(validator: BaseValidator): boolean`
  - `private getComputedFields(): Record<string, ComputedValidator>`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`

### src/validators/array-validator.ts
*Validator for array values, supporting per-item validation.*
*Lines: 205*

- **Class** `ArrayValidator extends BaseValidator`
  - `public validator: BaseValidator`
  - `public constructor(validator: BaseValidator, errorMessage?: string)`
  - `public matchesType(value: any): boolean`
  - `public override clone(): this`
  - `public flip(): this`
  - `public reverse(): this`
  - `public onlyUnique(): this`
  - `public sort(direction?: "asc" | "desc", key?: string): this`
  - `public minLength(length: number, errorMessage?: string): this`
  - `public maxLength(length: number, errorMessage?: string): this`
  - `public length(length: number, errorMessage?: string): this`
  - `public between(min: number, max: number, errorMessage?: string): this`
  - `public lengthBetween(min: number, max: number, errorMessage?: string): this`
  - `public unique(errorMessage?: string): this`
  - `public sorted(direction?: "asc" | "desc", errorMessage?: string): this`
  - `public mutate(data: any, context: SchemaContext): Promise<any>`
  - `public async validate(data: any, context: SchemaContext): Promise<ValidationResult>`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`

### src/validators/date-validator.ts
*Extensive validator for Date objects with comparison and formatting features.*
*Lines: 790*

- **Class** `DateValidator extends BaseValidator`
  - `public constructor(errorMessage?: string)`
  - `public matchesType(value: any): boolean`
  - `public toISOString(): this`
  - `public toTimestamp(): this`
  - `public toFormat(format: string): this`
  - `public toDateOnly(): this`
  - `public toTimeOnly(): this`
  - `public toStartOfDay(): this`
  - `public toEndOfDay(): this`
  - `public addDays(days: number): this`
  - `public addMonths(months: number): this`
  - `public addYears(years: number): this`
  - `public addHours(hours: number): this`
  - `public toUTC(): this`
  - `public toStartOfMonth(): this`
  - `public toEndOfMonth(): this`
  - `public toStartOfYear(): this`
  - `public toEndOfYear(): this`
  - `public min(dateOrField: Date | string | number, errorMessage?: string): this`
  - `public max(dateOrField: Date | string | number, errorMessage?: string): this`
  - `public before(dateOrField: Date | string | number, errorMessage?: string): this`
  - `public after(dateOrField: Date | string | number, errorMessage?: string): this`
  - `public between(startDate: Date, endDate: Date, errorMessage?: string): this`
  - `public today(errorMessage?: string): this`
  - `public fromToday(errorMessage?: string): this`
  - `public beforeToday(errorMessage?: string): this`
  - `public afterToday(errorMessage?: string): this`
  - `public past(errorMessage?: string): this`
  - `public future(errorMessage?: string): this`
  - `public minSibling(field: string, errorMessage?: string): this`
  - `public maxSibling(field: string, errorMessage?: string): this`
  - `public beforeSibling(field: string, errorMessage?: string): this`
  - `public afterSibling(field: string, errorMessage?: string): this`
  - `public sameAsField(field: string, errorMessage?: string): this`
  - `public sameAsFieldSibling(field: string, errorMessage?: string): this`
  - `public fromHour(hour: number, errorMessage?: string): this`
  - `public beforeHour(hour: number, errorMessage?: string): this`
  - `public betweenHours(startHour: number, endHour: number, errorMessage?: string): this`
  - `public fromMinute(minute: number, errorMessage?: string): this`
  - `public beforeMinute(minute: number, errorMessage?: string): this`
  - `public betweenMinutes(startMinute: number, endMinute: number, errorMessage?: string): this`
  - `public betweenTimes(startTime: string, endTime: string, errorMessage?: string): this`
  - `public age(years: number, errorMessage?: string): this`
  - `public minAge(years: number, errorMessage?: string): this`
  - `public maxAge(years: number, errorMessage?: string): this`
  - `public betweenAge(minAge: number, maxAge: number, errorMessage?: string): this`
  - `public weekDay(day: WeekDay, errorMessage?: string): this`
  - `public weekdays(days: WeekDay[], errorMessage?: string): this`
  - `public weekend(errorMessage?: string): this`
  - `public businessDay(errorMessage?: string): this`
  - `public format(format: string, errorMessage?: string): this`
  - `public withinDays(days: number, errorMessage?: string): this`
  - `public withinPastDays(days: number, errorMessage?: string): this`
  - `public withinFutureDays(days: number, errorMessage?: string): this`
  - `public month(month: Month, errorMessage?: string): this`
  - `public year(year: number, errorMessage?: string): this`
  - `public betweenYears(startYear: number | string, endYear: number | string, errorMessage?: string): this`
  - `public betweenMonths(startMonth: Month | string, endMonth: Month | string, errorMessage?: string): this`
  - `public betweenDays(startDay: number | string, endDay: number | string, errorMessage?: string): this`
  - `public betweenYearsSibling(startYearField: string, endYearField: string, errorMessage?: string): this`
  - `public betweenMonthsSibling(startMonthField: string, endMonthField: string, errorMessage?: string): this`
  - `public betweenDaysSibling(startDayField: string, endDayField: string, errorMessage?: string): this`
  - `public minYear(yearOrField: number | string, errorMessage?: string): this`
  - `public maxYear(yearOrField: number | string, errorMessage?: string): this`
  - `public minMonth(monthOrField: number | string, errorMessage?: string): this`
  - `public maxMonth(monthOrField: Month | string, errorMessage?: string): this`
  - `public minDay(dayOrField: number | string, errorMessage?: string): this`
  - `public maxDay(dayOrField: number | string, errorMessage?: string): this`
  - `public minYearSibling(field: string, errorMessage?: string): this`
  - `public maxYearSibling(field: string, errorMessage?: string): this`
  - `public minMonthSibling(field: string, errorMessage?: string): this`
  - `public maxMonthSibling(field: string, errorMessage?: string): this`
  - `public minDaySibling(field: string, errorMessage?: string): this`
  - `public maxDaySibling(field: string, errorMessage?: string): this`
  - `public quarter(quarter: 1 | 2 | 3 | 4, errorMessage?: string): this`
  - `public birthday(minAge?: number, maxAge?: number, errorMessage?: string): this`
  - `public leapYear(errorMessage?: string): this`
  - `public defaultNow(): this`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`

### src/validators/union-validator.ts
*Validator for values that can match one of multiple types.*

- **Class** `UnionValidator extends BaseValidator`
  - `public union(validators: BaseValidator[], errorMessage?: string): this`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`

### src/validators/record-validator.ts
*Validator for objects with dynamic keys and consistent value types.*

- **Class** `RecordValidator extends BaseValidator`
  - `public valueValidator: BaseValidator`
  - `public constructor(valueValidator: BaseValidator, errorMessage?: string)`
  - `public plainObject(errorMessage?: string): this`
  - `public matchesType(value: any): boolean`
  - `public override clone(): this`
  - `public async validate(data: any, context: SchemaContext): Promise<ValidationResult>`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`

---

### src/rules/core/
*Foundational presence and equality rules.*

- **rules/core/required.ts**: `requiredRule`, `presentRule`
- **rules/core/equal.ts**: `equalsRule`, `notEqualsRule`
- **rules/core/forbidden.ts**: `forbiddenRule`
- **rules/core/union.ts**: `unionRule`
- **rules/core/when.ts**: `whenRule`

### src/rules/string/
*Text-specific validation rules.*

- **rules/string/alpha.ts**: `alphaRule`, `alphaNumericRule`, `alphaDashRule`
- **rules/string/credit-card.ts**: `isCreditCardRule`
- **rules/string/email.ts**: `emailRule`
- **rules/string/ip.ts**: `ipRule`, `ip4Rule`, `ip6Rule`
- **rules/string/matches.ts**: `matchesRule`
- **rules/string/pattern.ts**: `patternRule`
- **rules/string/string-comparison.ts**: `startsWithRule`, `endsWithRule`, `containsRule`, `notContainsRule`
- **rules/string/strong-password-rule.ts**: `strongPasswordRule`
- **rules/string/url.ts**: `urlRule`
- **rules/string/without-whitespace.ts**: `withoutWhitespaceRule`

### src/rules/number/
*Numeric comparison and mathematical rules.*

- **rules/number/number-rules.ts**: `numberRule`, `minRule`, `maxRule`, `positiveRule`, `negativeRule`, `multipleOfRule`, `greaterThanRule`, `lessThanRule`, `evenRule`, `oddRule`, `betweenNumbersRule`, `moduloRule`

### src/rules/date/
*Complex date and time validation rules.*

- **rules/date/date.ts**: `dateRule`
- **rules/date/date-comparison-rules.ts**: `minDateRule`, `maxDateRule`, `betweenDatesRule`
- **rules/date/date-day-rules.ts**: `dayRule`, `weekDayRule`, `weekendRule`, `businessDayRule`
- **rules/date/date-field-comparison-rules.ts**: `afterFieldRule`, `beforeFieldRule`, `sameAsFieldDateRule`
- **rules/date/date-period-rules.ts**: `yearRule`, `monthRule`, `minYearRule`, `maxYearRule`, `minMonthRule`, `maxMonthRule`
- **rules/date/date-relative-rules.ts**: `todayRule`, `pastRule`, `futureRule`, `afterTodayRule`, `beforeTodayRule`
- **rules/date/date-special-rules.ts**: `leapYearRule`, `birthdayRule`, `ageRule`, `minAgeRule`, `maxAgeRule`

### src/rules/conditional/
*Rules that depend on the state of other fields.*

- **rules/conditional/required-if-rules.ts**: `requiredIfRule`, `requiredUnlessRule`
- **rules/conditional/required-with-rules.ts**: `requiredWithRule`, `requiredWithoutRule`
- **rules/conditional/present-if-rules.ts**: `presentIfRule`, `presentUnlessRule`
- **rules/conditional/forbidden-if-rules.ts**: `forbiddenIfRule`

### src/rules/common/
*Generic rules applicable to multiple types.*

- **rules/common/enum.ts**: `enumRule`, `inRule`
- **rules/common/type-rules.ts**: `stringRule`, `booleanRule`, `arrayRule`, `objectRule`
- **rules/common/unknown-key.ts**: `unknownKeyRule`

### src/rules/array/
- **rules/array/array-rules.ts**: `minItemsRule`, `maxItemsRule`, `uniqueArrayRule`, `sortedArrayRule`

### src/rules/length/
- **rules/length/length-rules.ts**: `lengthRule`, `minLengthRule`, `maxLengthRule`, `betweenLengthRule`

### src/rules/scalar/
- **rules/scalar/accepted-rule.ts**: `acceptedRule`
- **rules/scalar/declined-rule.ts**: `declinedRule`

---

### src/mutators/
*Data transformation functions applied during the validation lifecycle.*

- **mutators/string-mutators.ts**: `trimMutator`, `uppercaseMutator`, `lowercaseMutator`, `slugMutator`, `safeHtmlMutator`, etc.
- **mutators/number-mutators.ts**: `roundMutator`, `floorMutator`, `ceilMutator`, `absMutator`
- **mutators/date-mutators.ts**: `dateMutator`, `toUTCMutator`, `addDaysMutator`, `toStartOfDayMutator`
- **mutators/object-mutators.ts**: `stripUnknownMutator`, `objectTrimMutator`
- **mutators/array-mutators.ts**: `uniqueArrayMutator`, `sortArrayMutator`, `flipArrayMutator`

### src/plugins/
*Seal extension system for injecting custom validator methods.*

- **plugins/plugin-system.ts**
  - **Type** `SealPlugin`
  - **Function** `registerPlugin(plugin: SealPlugin): Promise<void>`
  - **Function** `unregisterPlugin(pluginName: string): Promise<void>`
  - **Function** `hasPlugin(pluginName: string): boolean`
  - **Function** `getInstalledPlugins(): SealPlugin[]`

### src/standard-schema/
*Compliance utilities for the Standard Schema specification.*

- **standard-schema/json-schema.ts**
  - **Type** `JsonSchemaTarget`
  - **Function** `applyNullable(schema: JsonSchemaResult, target: JsonSchemaTarget): void`
  - **Function** `wrapNullableStrict(schema: JsonSchemaResult): JsonSchemaResult`
- **standard-schema/map-result.ts**
  - **Function** `mapToStandardResult(result: ValidationResult): StandardSchemaV1.Result`


