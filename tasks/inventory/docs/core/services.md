# @warlock.js/core Audit — Services (Mail, Encryption, Image)

**Status:** 🔴 Critical Gaps

**Sources scanned:** `core/src/mail/`, `core/src/encryption/`, `core/src/image/`
**Docs reviewed:** `docs/warlock/mail/` (2 pages), `docs/warlock/image/` (1 page), no encryption doc directory exists

---

## Coverage Map

| Feature | Source Export | Doc Coverage | Gap |
|---------|--------------|-------------|-----|
| `sendMail()` | `mail/send-mail.ts` | Partial — intro.mdx shows basic usage | Missing: modes, events, `component` prop, `MailResult`, cancellation via `beforeSending` |
| `Mail` (fluent builder) | `mail/mail.ts` | None | Entire class undocumented |
| `setMailConfigurations()` | `mail/config.ts` | None | Multi-mailer / named-mailer config not shown |
| `setMailMode()` | `mail/config.ts` | None | `production` / `development` / `test` modes not documented |
| `getMailMode()`, `isProductionMode()`, `isDevelopmentMode()`, `isTestMode()` | `mail/config.ts` | None | Undocumented |
| `resolveMailConfig()`, `getDefaultMailConfig()`, `getMailerConfig()`, `resetMailConfig()` | `mail/config.ts` | None | Undocumented (mostly internal, but `resetMailConfig` is test-relevant) |
| `MailersConfig` (named mailers) | `mail/types.ts` | None | Multi-mailer architecture completely absent from docs |
| `SESConfigurations` (AWS SES driver) | `mail/types.ts` | None | SES driver support undocumented |
| `SMTPConfigurations` (full options) | `mail/types.ts` | Partial — configurations.mdx only shows 6 fields | Missing: `tls`, `auth`, `requireTLS`, `driver`, provider examples (Gmail, SendGrid, Mailgun, Postmark, SES via SMTP) |
| `MailAddress` (name + address object) | `mail/types.ts` | None | Named sender object form not documented |
| `MailOptions` (`id`, `correlationId`, `tags`, `priority`, `headers`, `replyTo`) | `mail/types.ts` | None | Only `to/subject/html/text/cc/bcc/attachments` are shown in existing docs |
| `MailAttachment` (path-based form) | `mail/types.ts` | Partial — old field list in intro.mdx | `path` variant, `cid` (inline), `encoding` not documented |
| `MailResult` | `mail/types.ts` | None | Return value shape never explained |
| `MailError` + `MailErrorCode` | `mail/types.ts` | None | Error handling / error codes completely absent |
| `MailEvents` (per-mail callbacks) | `mail/types.ts` | None | `beforeSending`, `onSent`, `onSuccess`, `onError` undocumented |
| `mailEvents` (global event bus) | `mail/events.ts` | None | Global event subscription (`mailEvents.onSuccess`, etc.) undocumented |
| `MAIL_EVENTS` constants | `mail/events.ts` | None | Undocumented |
| `generateMailId()` | `mail/events.ts` | None | Undocumented |
| `getMailEventName()` | `mail/events.ts` | None | Undocumented |
| `getMailer()`, `verifyMailer()`, `closeMailer()`, `closeAllMailers()`, `getPoolStats()` | `mail/mailer-pool.ts` | None | Connection pool management entirely undocumented |
| `renderReactMail()` | `mail/react-mail.ts` | Partial — intro.mdx shows `sendReactMail` (stale API) | Actual export is `renderReactMail()` + `component` option on `sendMail`; `@react-email/render` fallback not documented |
| Test mailbox — `captureMail()`, `getTestMailbox()`, `getLastMail()`, `findMailsTo()`, `findMailsBySubject()`, `wasMailSentTo()`, `wasMailSentWithSubject()`, `getMailboxSize()`, `clearTestMailbox()`, `assertMailSent()`, `assertMailCount()` | `mail/test-mailbox.ts` | None | Entire test utilities module undocumented |
| `encrypt()` | `encryption/encrypt.ts` | None | No encryption doc section exists |
| `decrypt()` | `encryption/encrypt.ts` | None | No encryption doc section exists |
| `hmacHash()` | `encryption/hash.ts` | None | No encryption doc section exists |
| `hashPassword()` | `encryption/password.ts` | None | No encryption doc section exists |
| `verifyPassword()` | `encryption/password.ts` | None | No encryption doc section exists |
| `EncryptionConfigurations` | `encryption/types.ts` | None | Key generation, algorithm config, hmacKey absent |
| `EncryptionPasswordConfigurations` | `encryption/types.ts` | None | `saltRounds` config absent |
| `Image` class (constructor) | `image/image.ts` | Partial — introduction.mdx shows `new Image(path)` | Misses static factories and most methods |
| `Image.fromFile()` | `image/image.ts` | None | Static factory undocumented |
| `Image.fromBuffer()` | `image/image.ts` | None | Static factory undocumented |
| `Image.fromUrl()` | `image/image.ts` | None | Static factory undocumented |
| `image.apply()` | `image/image.ts` | None | Batch-transform API undocumented |
| `image.resize()` | `image/image.ts` | Partial — one code example (wrong signature: shows `(200, 200)`, source takes `ResizeOptions` object) | Signature mismatch; `ResizeOptions` not explained |
| `image.crop()` | `image/image.ts` | None | Undocumented |
| `image.quality()` | `image/image.ts` | None | Undocumented |
| `image.format()` | `image/image.ts` | None | Undocumented |
| `image.save()` | `image/image.ts` | Partial — shown in examples | Return value (`sharp.OutputInfo`) not explained |
| `image.saveAsWebp()` | `image/image.ts` | None | Undocumented |
| `image.toBuffer()` | `image/image.ts` | None | Undocumented |
| `image.toBase64()` | `image/image.ts` | None | Undocumented |
| `image.toDataUrl()` | `image/image.ts` | None | Undocumented |
| `image.watermark()` | `image/image.ts` | Partial — shown in examples | Deferred execution not explained; options not documented |
| `image.watermarks()` | `image/image.ts` | Partial — shown in examples | `WatermarkConfig` shape not documented |
| `image.opacity()` | `image/image.ts` | None | Undocumented |
| `image.blackAndWhite()` / `grayscale()` | `image/image.ts` | None | Undocumented |
| `image.rotate()` | `image/image.ts` | None | Undocumented |
| `image.flip()` / `flop()` | `image/image.ts` | None | Undocumented |
| `image.blur()` | `image/image.ts` | None | Undocumented |
| `image.sharpen()` | `image/image.ts` | None | Undocumented |
| `image.negate()` | `image/image.ts` | None | Undocumented |
| `image.tint()` | `image/image.ts` | None | Undocumented |
| `image.trim()` | `image/image.ts` | None | Undocumented |
| `image.dimensions()` / `metadata()` / `refreshMetadata()` / `clearMetadataCache()` | `image/image.ts` | None | Undocumented |
| `image.clone()` | `image/image.ts` | None | Undocumented |
| `image.reset()` / `resetOptions()` / `clearOperations()` | `image/image.ts` | None | Undocumented |
| `image.getOptions()` / `getPendingOperationsCount()` | `image/image.ts` | None | Undocumented |
| `ImageTransformOptions` type | `image/image.ts` | None | Batch-transform options shape undocumented |
| `ImageFormat` / `ImageInput` / `WatermarkConfig` types | `image/image.ts` | None | Undocumented |

---

## Technical Findings

### 1. Mail — Stale `sendReactMail` Reference in Docs
`docs/warlock/mail/introduction.mdx` documents a function called `sendReactMail` with a `render` property. This function does not exist in the current source. The real API renders React by passing a `component` property to `sendMail()`, or calling the lower-level `renderReactMail()` directly. Any developer following the current doc will hit a runtime import error. This is the highest-priority correction needed.

### 2. Mail — `Mail` Fluent Builder Completely Absent
The `Mail` class is the primary ergonomic API for sending email and is a top-level export. It offers a full chainable builder (`Mail.to(...).subject(...).component(...).send()`). It has zero documentation. Developers are forced to use the lower-level `sendMail()` object form without knowing a fluent alternative exists.

### 3. Mail — Multi-Mailer / Named Mailer Architecture Undocumented
`setMailConfigurations()` accepts either a simple `MailConfigurations` object or a `MailersConfig` object containing a `default` mailer and an arbitrary set of named `mailers`. This is the multi-tenant dispatch mechanism. It is entirely absent from documentation. `Mail.mailer("name")`, `Mail.config(tenantConfig)`, and `sendMail({ mailer: "name" })` are also undocumented.

### 4. Mail — Three Modes (`production` / `development` / `test`) Undocumented
`setMailMode()` controls whether emails are actually sent (production), logged to console without sending (development), or captured to the in-memory test mailbox (test). This is a foundational workflow feature for CI, local dev, and unit testing. It is completely absent from both existing doc pages.

### 5. Mail — Full Test Utilities Module Undocumented
`mail/test-mailbox.ts` exports 11 public functions specifically for unit-testing mail sending. None appear in docs. Developers testing email flows have no guidance on how to set up the test mailbox, clear it between tests, or use assertion helpers like `assertMailSent` and `assertMailCount`.

### 6. Mail — AWS SES Driver Completely Undocumented
`SESConfigurations` is exported from `mail/types.ts` and is a first-class driver option selectable via `driver: "ses"`. The configurations doc only shows SMTP. There is no mention of SES, the required `@aws-sdk/client-sesv2` peer dependency, or how to configure `accessKeyId / secretAccessKey / region`. The mailer pool also handles SES differently (separate client path).

### 7. Mail — Event System (`mailEvents`, per-mail callbacks) Undocumented
Two complementary event systems exist: (a) per-mail inline callbacks (`beforeSending`, `onSent`, `onSuccess`, `onError` on `MailOptions`) and (b) a global event bus (`mailEvents.onSuccess`, `mailEvents.onMailSuccess(mailId, ...)`, etc.). Neither is mentioned in docs. The `beforeSending` cancellation pattern — returning `false` from the handler halts delivery — is particularly high-value and completely invisible.

### 8. Mail — Connection Pool Management Undocumented
`mailer-pool.ts` exports `verifyMailer`, `closeMailer`, `closeAllMailers`, and `getPoolStats`. These are necessary for graceful shutdown and debugging pool exhaustion in production. Not documented anywhere.

### 9. Mail — `MailError` Class and Error Codes Undocumented
The source throws typed `MailError` instances with a `code` field (`CONNECTION_ERROR`, `AUTH_ERROR`, `RATE_LIMIT`, `INVALID_ADDRESS`, `REJECTED`, `TIMEOUT`, `RENDER_ERROR`, `CONFIG_ERROR`, `UNKNOWN`). Error handling patterns and structured error codes are not mentioned anywhere in docs, making it impossible for developers to write meaningful catch blocks.

### 10. Encryption — Zero Documentation Exists
There is no `docs/warlock/encryption/` directory. The entire `src/encryption/` module — `encrypt()`, `decrypt()`, `hmacHash()`, `hashPassword()`, `verifyPassword()`, and `EncryptionConfigurations` — has no user-facing documentation. This affects three distinct developer workflows: symmetric encryption of sensitive data (AES-256-GCM), HMAC fingerprinting for searchable sensitive fields, and bcrypt password hashing.

### 11. Encryption — `hmacHash()` Not in Inventory
The inventory lists only `encrypt`, `decrypt`, `hashPassword`, `verifyPassword` under `src/encryption/`. The source exports a fifth function `hmacHash(plainText: string): string` from `encryption/hash.ts`. This is missing from the inventory and from all documentation.

### 12. Image — `resize()` Signature Mismatch in Doc
`docs/warlock/image/introduction.mdx` shows `image.resize(200, 200)` (two positional numbers). The source signature is `resize(options: sharp.ResizeOptions)` — an options object. The call shown in the doc will produce a TypeScript error and incorrect runtime behaviour (the `200` number is passed as the options object). The correct usage is `image.resize({ width: 200, height: 200 })`.

### 13. Image — Deferred Pipeline Architecture Not Explained
The `Image` class queues all transformation operations synchronously and executes them only when an output method (`save`, `toBuffer`, `toBase64`, `toDataUrl`) is awaited. This is the key mental model for using the class correctly. The single doc page does not explain this, which will lead to confusion about when to `await` and why intermediate method calls are not async.

### 14. Image — Static Factory Methods Undocumented
`Image.fromFile()`, `Image.fromBuffer()`, and `Image.fromUrl()` are alternative constructors. Only the `new Image(path)` constructor form is shown. `Image.fromUrl()` is particularly notable: it uses `axios` for an HTTP fetch and is the only async static factory.

### 15. Image — Most Transformation Methods Have No Documentation
Only `resize`, `watermark`, and `watermarks` have any examples. The following methods are entirely absent from docs: `apply`, `crop`, `quality`, `format`, `saveAsWebp`, `toBuffer`, `toBase64`, `toDataUrl`, `opacity`, `blackAndWhite`/`grayscale`, `rotate`, `flip`, `flop`, `blur`, `sharpen`, `negate`, `tint`, `trim`, `dimensions`, `metadata`, `refreshMetadata`, `clearMetadataCache`, `clone`, `reset`, `resetOptions`, `clearOperations`, `getOptions`, `getPendingOperationsCount`.

### 16. Image — `apply()` Batch API and `ImageTransformOptions` Undocumented
`apply(options: ImageTransformOptions)` allows all transformations to be specified as a single options object with a guaranteed execution order (resize → crop → rotate → flip/flop → colorspace → blur/sharpen → tint → negate → trim → watermark → opacity → format). This is the most concise API surface for configuration-driven image processing and has no documentation.

---

## Incorrect Inventory Entries

1. **`hmacHash()` is missing from the inventory.** The inventory lists only `encrypt`, `decrypt`, `hashPassword`, `verifyPassword` under `src/encryption/`. The source exports a fifth function `hmacHash(plainText: string): string` from `encryption/hash.ts`. It must be added to the inventory's Encryption section.

2. **`MailersConfig` type is not listed in the inventory.** `mail/types.ts` exports `MailersConfig`, which is the accepted input type for `setMailConfigurations()` when configuring named mailers. The inventory omits it from the types export list.

3. **`MAIL_EVENTS` constant is not listed in the inventory.** The inventory captures `generateMailId`, `getMailEventName`, `mailEvents` from `events.ts` but omits the `MAIL_EVENTS` object constant, which is exported and used by consumers subscribing to raw event names.

4. **`MailError` class treatment in inventory.** `MailError` is a concrete class exported separately (`export { MailError } from "./types"` in `index.ts`). The inventory groups it with the type exports. It should be separated and listed as a class with its `code`, `originalError`, and constructor signature.

5. **`Image.readonly image: sharp.Sharp` is listed as a developer-facing API.** While technically public, this exposes the raw Sharp instance and is not a stable abstraction boundary. It should be annotated `@internal` in the inventory or removed from the public API surface listed there.

---

## Action Plan

### Mail

- [ ] **Update** `docs/warlock/mail/introduction.mdx` — Replace stale `sendReactMail`/`render` example with the correct `sendMail({ component: <MyEmail /> })` pattern; document `MailResult` return value; add `MailAddress` named object form; add `replyTo`, `priority`, `tags`, `correlationId`, `headers` to the options table; fix `MailAttachment` table to include `path`, `cid`, `encoding`
- [ ] **Update** `docs/warlock/mail/configurations.mdx` — Add full `SMTPConfigurations` field reference (including `tls`, `auth`, `requireTLS`); add provider-specific SMTP examples (Gmail, SendGrid, Mailgun, Postmark)
- [ ] **Create** `docs/warlock/mail/fluent-builder.mdx` — Document the `Mail` class: all static factories, all chainable instance methods, and end-to-end examples including multi-tenant and attachment patterns
- [ ] **Create** `docs/warlock/mail/mail-modes.mdx` — Document `setMailMode("production" | "development" | "test")` and the behavioural difference for each mode; show recommended setup in app bootstrap
- [ ] **Create** `docs/warlock/mail/testing.mdx` — Document the full test mailbox API: setup (`setMailMode("test")`, `clearTestMailbox()`), all helper functions, and `assertMailSent` / `assertMailCount` usage with vitest/jest examples
- [ ] **Create** `docs/warlock/mail/ses-driver.mdx` — Document AWS SES `driver: "ses"` configuration, `SESConfigurations` type, `@aws-sdk/client-sesv2` peer dependency, and `warlock add ses` install command
- [ ] **Create** `docs/warlock/mail/events.mdx` — Document global `mailEvents` bus (`onBeforeSending`, `onSent`, `onSuccess`, `onError`) and per-mail inline callbacks; show `generateMailId()` + `onMailSuccess` for tracking individual mails; explain `beforeSending` cancellation by returning `false`
- [ ] **Create** `docs/warlock/mail/multi-mailer.mdx` — Document `MailersConfig`, `setMailConfigurations({ default, mailers })`, selecting a named mailer via `Mail.mailer("name")` and `sendMail({ mailer: "name" })`
- [ ] **Create** `docs/warlock/mail/error-handling.mdx` — Document `MailError` class, all `MailErrorCode` values, structured error handling in try/catch, and pool management (`verifyMailer`, `closeMailer`, `closeAllMailers`)

### Encryption (new section — no docs exist)

- [ ] **Create** `docs/warlock/encryption/_category_.json`
- [ ] **Create** `docs/warlock/encryption/introduction.mdx` — Overview of the three sub-systems: symmetric encryption, HMAC fingerprinting, password hashing; note bcryptjs peer dependency
- [ ] **Create** `docs/warlock/encryption/symmetric.mdx` — Document `encrypt()` / `decrypt()` with AES-256-GCM; key generation command; `EncryptionConfigurations` (`key`, `algorithm`); output format (`iv:ciphertext:authTag`); tamper-detection behaviour
- [ ] **Create** `docs/warlock/encryption/hmac.mdx` — Document `hmacHash()`; explain fingerprinting use-case (searchable sensitive fields without storing plaintext); `hmacKey` config; separate-key best practice
- [ ] **Create** `docs/warlock/encryption/passwords.mdx` — Document `hashPassword()` / `verifyPassword()`; bcrypt salt rounds config (`encryption.password.salt`); bcryptjs install (`npm install bcryptjs`)
- [ ] **Update** `tasks/inventory/core/services.md` — Add `hmacHash()` to the Encryption & Passwords section

### Image

- [ ] **Update** `docs/warlock/image/introduction.mdx` — Fix `resize(200, 200)` → `resize({ width: 200, height: 200 })`; add explanation of the deferred pipeline model (all chain calls are sync; only output methods are async)
- [ ] **Create** `docs/warlock/image/static-factories.mdx` — Document `Image.fromFile()`, `Image.fromBuffer()`, `Image.fromUrl()` (with axios note and async nature)
- [ ] **Create** `docs/warlock/image/transformations.mdx` — Document all transformation methods with examples: `apply` (with execution-order table), `crop`, `rotate`, `flip`, `flop`, `blur`, `sharpen`, `negate`, `tint`, `trim`, `opacity`, `blackAndWhite`/`grayscale`, `quality`, `format`; include `ImageTransformOptions` reference
- [ ] **Create** `docs/warlock/image/output.mdx` — Document `save()`, `saveAsWebp()`, `toBuffer()`, `toBase64()`, `toDataUrl()`; explain format auto-detection and per-format quality behaviour (PNG compressionLevel mapping, GIF preservation)
- [ ] **Create** `docs/warlock/image/metadata.mdx` — Document `dimensions()`, `metadata()`, `refreshMetadata()`, `clearMetadataCache()` and caching behaviour
- [ ] **Create** `docs/warlock/image/advanced.mdx` — Document `clone()`, `reset()`, `resetOptions()`, `clearOperations()`, `getOptions()`, `getPendingOperationsCount()`; show multiple-output pattern using `clone()`
