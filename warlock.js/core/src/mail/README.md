# Mail

Email sending system. Supports SMTP via nodemailer with connection pooling, React-based email templates, event hooks, and a test mailbox for development/testing.

## Key Files

| File              | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `mail.ts`         | `Mail` class — builds and sends an email with fluent API   |
| `send-mail.ts`    | `sendMail()` — lower-level send function with full options |
| `mailer-pool.ts`  | SMTP connection pool management                            |
| `react-mail.ts`   | Renders React components to HTML for email bodies          |
| `config.ts`       | Mail configuration defaults and types                      |
| `events.ts`       | Mail event hooks (before/after send)                       |
| `test-mailbox.ts` | In-memory mailbox for testing — captures sent emails       |
| `types.ts`        | Mail type definitions                                      |
| `index.ts`        | Barrel export                                              |

## Key Exports

- `Mail` — fluent email builder class
- `sendMail()` — direct send function
- `testMailbox` — test helper for capturing emails
- Mail event hooks

## Dependencies

### Internal (within `core/src`)

- `../config` — SMTP config (host, port, auth)
- `../react` — `renderReact()` for React email templates
- `../utils` — environment checks

### External

- `nodemailer` — SMTP transport
- `react` / `react-dom` — optional, for React email templates

## Used By

- Application-level code sending transactional emails
- `@warlock.js/auth` — sends password reset / verification emails
- `tests/` — uses `testMailbox` to verify emails in tests
