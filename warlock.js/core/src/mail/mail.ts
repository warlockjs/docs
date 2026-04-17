import type React from "react";
import { sendMail } from "./send-mail";
import type {
  MailAddress,
  MailAttachment,
  MailConfigurations,
  MailEvents,
  MailOptions,
  MailPriority,
  MailResult,
} from "./types";

/**
 * Fluent Mail Builder
 *
 * Provides a chainable API for building and sending emails.
 *
 * @example
 * ```typescript
 * await Mail.to("user@example.com")
 *   .subject("Welcome!")
 *   .component(<WelcomeEmail name="John" />)
 *   .send();
 *
 * // With attachments
 * await Mail.to("user@example.com")
 *   .cc("manager@example.com")
 *   .subject("Invoice")
 *   .component(<InvoiceEmail order={order} />)
 *   .attach(pdfBuffer, "invoice.pdf")
 *   .send();
 *
 * // Multi-tenant
 * await Mail.config(tenant.mailSettings)
 *   .to("user@example.com")
 *   .subject("Hello")
 *   .html("<p>World</p>")
 *   .send();
 * ```
 */
export class Mail {
  private options: Partial<MailOptions> = {};

  /**
   * Private constructor - use static factory methods
   */
  private constructor() {}

  /**
   * Create a new mail with recipient
   */
  public static to(recipient: string | string[]): Mail {
    const mail = new Mail();
    mail.options.to = recipient;

    return mail;
  }

  /**
   * Create a new mail with custom configuration (multi-tenant)
   */
  public static config(config: MailConfigurations): Mail {
    const mail = new Mail();
    mail.options.config = config;

    return mail;
  }

  /**
   * Create a new mail with named mailer
   */
  public static mailer(name: string): Mail {
    const mail = new Mail();
    mail.options.mailer = name;

    return mail;
  }

  /**
   * Set recipient(s)
   */
  public to(recipient: string | string[]): this {
    this.options.to = recipient;

    return this;
  }

  /**
   * Set CC recipient(s)
   */
  public cc(recipient: string | string[]): this {
    this.options.cc = recipient;

    return this;
  }

  /**
   * Set BCC recipient(s)
   */
  public bcc(recipient: string | string[]): this {
    this.options.bcc = recipient;

    return this;
  }

  /**
   * Set reply-to address
   */
  public replyTo(address: string): this {
    this.options.replyTo = address;

    return this;
  }

  /**
   * Set from address
   */
  public from(address: MailAddress): this {
    this.options.from = address;

    return this;
  }

  /**
   * Set subject
   */
  public subject(subject: string): this {
    this.options.subject = subject;

    return this;
  }

  /**
   * Set HTML content
   */
  public html(content: string): this {
    this.options.html = content;

    return this;
  }

  /**
   * Set plain text content
   */
  public text(content: string): this {
    this.options.text = content;

    return this;
  }

  /**
   * Set React component as content
   */
  public component(element: React.ReactElement): this {
    this.options.component = element;

    return this;
  }

  /**
   * Add attachment
   */
  public attach(content: Buffer | string, filename: string, contentType?: string): this {
    if (!this.options.attachments) {
      this.options.attachments = [];
    }

    this.options.attachments.push({
      filename,
      content,
      contentType,
    });

    return this;
  }

  /**
   * Add multiple attachments
   */
  public attachments(attachments: MailAttachment[]): this {
    this.options.attachments = [...(this.options.attachments || []), ...attachments];

    return this;
  }

  /**
   * Attach a file by path
   *
   * The file will be read automatically when the email is sent.
   *
   * @param path Path to the file
   * @param filename Optional custom filename (defaults to basename of path)
   * @param contentType Optional MIME type
   *
   * @example
   * ```typescript
   * Mail.to("user@example.com")
   *   .subject("Invoice")
   *   .html("<p>Please see attached</p>")
   *   .attachFile("./invoices/2024-001.pdf")
   *   .attachFile("./terms.pdf", "terms-and-conditions.pdf")
   *   .send();
   * ```
   */
  public attachFile(path: string, filename?: string, contentType?: string): this {
    if (!this.options.attachments) {
      this.options.attachments = [];
    }

    // Extract filename from path if not provided
    const resolvedFilename = filename || path.split(/[/\\]/).pop() || "attachment";

    this.options.attachments.push({
      path,
      filename: resolvedFilename,
      contentType,
    });

    return this;
  }

  /**
   * Set priority
   */
  public priority(level: MailPriority): this {
    this.options.priority = level;

    return this;
  }

  /**
   * Set custom headers
   */
  public headers(headers: Record<string, string>): this {
    this.options.headers = { ...this.options.headers, ...headers };

    return this;
  }

  /**
   * Add a custom header
   */
  public header(name: string, value: string): this {
    this.options.headers = { ...this.options.headers, [name]: value };

    return this;
  }

  /**
   * Set tags for categorization
   */
  public tags(tags: string[]): this {
    this.options.tags = tags;

    return this;
  }

  /**
   * Add a tag
   */
  public tag(tag: string): this {
    this.options.tags = [...(this.options.tags || []), tag];

    return this;
  }

  /**
   * Set correlation ID for tracking
   */
  public correlationId(id: string): this {
    this.options.correlationId = id;

    return this;
  }

  /**
   * Set configuration (multi-tenant)
   */
  public withConfig(config: MailConfigurations): this {
    this.options.config = config;

    return this;
  }

  /**
   * Set named mailer
   */
  public withMailer(name: string): this {
    this.options.mailer = name;

    return this;
  }

  /**
   * Set beforeSending event handler
   */
  public beforeSending(handler: MailEvents["beforeSending"]): this {
    this.options.beforeSending = handler;

    return this;
  }

  /**
   * Set onSent event handler
   */
  public onSent(handler: MailEvents["onSent"]): this {
    this.options.onSent = handler;

    return this;
  }

  /**
   * Set onSuccess event handler
   */
  public onSuccess(handler: MailEvents["onSuccess"]): this {
    this.options.onSuccess = handler;

    return this;
  }

  /**
   * Set onError event handler
   */
  public onError(handler: MailEvents["onError"]): this {
    this.options.onError = handler;

    return this;
  }

  /**
   * Get the built options (for debugging)
   */
  public getOptions(): Partial<MailOptions> {
    return { ...this.options };
  }

  /**
   * Validate the mail before sending
   */
  private validate(): void {
    if (!this.options.to) {
      throw new Error("Mail recipient (to) is required");
    }

    if (!this.options.subject) {
      throw new Error("Mail subject is required");
    }

    if (!this.options.html && !this.options.text && !this.options.component) {
      throw new Error("Mail content (html, text, or component) is required");
    }
  }

  /**
   * Send the email
   */
  public async send(): Promise<MailResult> {
    this.validate();

    return sendMail(this.options as MailOptions);
  }
}
