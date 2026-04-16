# @warlock.js/core — Validation Inventory

### src/validation/types.ts
*Framework validator type augmentations for database, file, and localized validation.*

- **Type** `ValidationConfiguration`

### src/validation/validateAll.ts
*Middleware for validating request route schemas and custom validation logic.*

- **Function** `validateAll(validation: Route["handler"]["validation"], request: Request, response: Response): Promise<any>`
- **Function** `resolveDataToParse(validating: RequestHandlerValidation["validating"], request: Request): any`

### src/validation/init.ts
*Initializes @warlock.js/seal with framework-specific settings and plugins.*

### src/validation/database/index.ts
*Public exports for database validation rules.*

### src/validation/database/types.ts
*Type definitions for database query-based validation rules.*

- **Type** `BaseQueryRuleOptions`
- **Type** `BaseUniqueRuleOptions`
- **Type** `UniqueRuleOptions`
- **Type** `UniqueExceptCurrentUserRuleOptions`
- **Type** `UniqueExceptCurrentIdRuleOptions`
- **Type** `ExistsRuleOptions`
- **Type** `ExistsExceptCurrentUserRuleOptions`
- **Type** `ExistsExceptCurrentIdRuleOptions`

### src/validation/database/exists.ts
*Validation rule to verify a record exists in the database.*

- **Constant** `existsRule: SchemaRule<ExistsRuleOptions>`

### src/validation/database/unique.ts
*Validation rule to verify a value is unique in the database.*

- **Constant** `uniqueRule: SchemaRule<UniqueRuleOptions>`

### src/validation/database/unique-except-current-id.ts
*Validation rule to verify uniqueness while ignoring the current record ID.*

- **Constant** `uniqueExceptCurrentIdRule: SchemaRule<UniqueExceptCurrentIdRuleOptions>`

### src/validation/plugins/database-plugin.ts
*Seal plugin injecting database validation methods into standard validators.*

- **Constant** `databasePlugin: SealPlugin`

### src/validation/plugins/localized-plugin.ts
*Seal plugin adding support for validating localized value structures (localeCode/value).*

- **Constant** `localizedPlugin: SealPlugin`

### src/validation/validators/file-validator.ts
*Specialized validator for UploadedFile instances with image-specific rules.*

- **Constant** `uploadedFileMetadataSchema: ObjectValidator`
- **Class** `FileValidator`
  - `public constructor(errorMessage?: string)`
  - `public matchesType(value: any): boolean`
  - `public image(errorMessage?: string): FileValidator`
  - `public accept(extensions: string | string[], errorMessage?: string): FileValidator`
  - `public mimeType(mimeTypes: string | string[], errorMessage?: string): FileValidator`
  - `public pdf(errorMessage?: string): FileValidator`
  - `public excel(errorMessage?: string): FileValidator`
  - `public word(errorMessage?: string): FileValidator`
  - `public minSize(size: number | FileSizeOption, errorMessage?: string): FileValidator`
  - `public min(size: number | FileSizeOption, errorMessage?: string): FileValidator`
  - `public maxSize(size: number | FileSizeOption, errorMessage?: string): FileValidator`
  - `public max(size: number, errorMessage?: string): FileValidator`
  - `public minWidth(width: number, errorMessage?: string): FileValidator`
  - `public maxWidth(width: number, errorMessage?: string): FileValidator`
  - `public minHeight(height: number, errorMessage?: string): FileValidator`
  - `public maxHeight(height: number, errorMessage?: string): FileValidator`
  - `public saveTo(relativeDirectory: string): FileValidator`
  - `public override toJsonSchema(target?: JsonSchemaTarget): JsonSchemaResult`
