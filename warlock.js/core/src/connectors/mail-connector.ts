import config from "@mongez/config";
import { closeAllMailers, setMailConfigurations } from "../mail";
import { BaseConnector } from "./base-connector";
import { ConnectorPriority } from "./types";

/**
 * Mailer Connector
 * Manages mailer lifecycle and ensures graceful pool shutdown
 */
export class MailerConnector extends BaseConnector {
  public readonly name = "mailer";
  public readonly priority = ConnectorPriority.MAILER;

  /**
   * Files that trigger mailer restart
   */
  protected readonly watchedFiles = [".env", "src/config/mail.ts", "src/config/mail.tsx"];

  /**
   * Initialize mailer configurations
   */
  public async start(): Promise<void> {
    const mailConfig = config.get("mail");

    if (!mailConfig) {
      return;
    }

    try {
      setMailConfigurations(mailConfig);
      this.active = true;
    } catch (error) {
      console.error("Failed to initialize mailer:", error);
      throw error;
    }
  }

  /**
   * Shutdown mailer pool
   */
  public async shutdown(): Promise<void> {
    if (!this.active) {
      return;
    }

    try {
      closeAllMailers();
      this.active = false;
    } catch (error) {
      console.error("Failed to close all mailers:", error);
      throw error;
    }
  }
}
