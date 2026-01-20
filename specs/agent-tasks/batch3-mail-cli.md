# Agent Task: Mail + CLI Sections

## Assignment

**Sections**: Mail + CLI  
**Pages**: 8 (4 + 4)  
**Priority**: MEDIUM-LOW (Batch 3)  
**Status**: ⏳ Not Started

---

## Mail Pages to Write

| #   | File                       | Status |
| --- | -------------------------- | ------ |
| 1   | `mail/introduction.mdx`    | ⬜     |
| 2   | `mail/configuration.mdx`   | ⬜     |
| 3   | `mail/sending.mdx`         | ⬜     |
| 4   | `mail/react-templates.mdx` | ⬜     |

## CLI Pages to Write

| #   | File                         | Status |
| --- | ---------------------------- | ------ |
| 5   | `cli/commands-overview.mdx`  | ⬜     |
| 6   | `cli/generating-modules.mdx` | ⬜     |
| 7   | `cli/custom-commands.mdx`    | ⬜     |
| 8   | `cli/migrations-cli.mdx`     | ⬜     |

---

## STEP 1: Read Source Code First

### Mail System

```
@warlock.js/core/src/mail/
├── mail.ts                # 7.3KB - Main mail class
├── send-mail.ts           # 12KB - Sending logic
├── mailer-pool.ts         # Connection pooling
├── react-mail.ts          # React email templates
├── test-mailbox.ts        # Testing
├── config.ts
├── events.ts
└── types.ts
```

### CLI System

```
@warlock.js/core/src/cli/
├── cli-command.ts         # 6.5KB - Base command
├── cli-commands.manager.ts # 13KB - Registry
├── commands/              # Built-in commands
└── framework-cli-commands.ts
```

---

## Mail Section Key Points

### React Email Templates

- Send React components as email body
- `response.render(<Component />)` style
- Pass props to email templates

### Mail Configuration

- SMTP settings
- Multiple mailers
- Connection pooling

### Sending Emails

- Basic send
- With attachments
- Queue integration (future)

---

## CLI Section Key Points

### Built-in Commands

- `warlock generate:module`
- `warlock migrate`
- `warlock seed`
- `warlock jwt:secret`

### Custom Commands

- Creating command classes
- Arguments and options
- Interactive prompts

---

## STEP 2: Write Documentation

### Output Locations

```
docs/warlock-docs-latest/docs/warlock/mail/
├── _category_.json
├── introduction.mdx
├── configuration.mdx
├── sending.mdx
└── react-templates.mdx

docs/warlock-docs-latest/docs/warlock/cli/
├── _category_.json
├── commands-overview.mdx
├── generating-modules.mdx
├── custom-commands.mdx
└── migrations-cli.mdx
```

---

## Code Example Pattern

### Mail

```typescript
// React email template
import { Mail } from "@warlock.js/core";

// Send with React component
await Mail.send({
  to: "user@example.com",
  subject: "Welcome!",
  component: <WelcomeEmail name={user.name} />,
});

// Simple send
await Mail.send({
  to: "user@example.com",
  subject: "Hello",
  html: "<p>Hello World</p>",
});
```

### CLI

```typescript
// Custom command
import { CliCommand } from "@warlock.js/core";

export class GreetCommand extends CliCommand {
  public static command = "greet";
  public static description = "Greet someone";

  public async execute() {
    const name = this.argument("name");
    console.log(`Hello, ${name}!`);
  }
}
```

---

## Completion Criteria

- [ ] All 8 pages written (4 mail + 4 cli)
- [ ] React email templates documented
- [ ] Built-in CLI commands listed
- [ ] Custom command creation documented
- [ ] PROGRESS.md updated

---

## Notes

[Agent: Add notes here during work]
