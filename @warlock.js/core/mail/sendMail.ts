import { log } from "@warlock.js/logger";
import nodemailer from "nodemailer";
import type { Options } from "nodemailer/lib/mailer";
import type React from "react";
import { getMailConfigurations } from "./config";
import { renderReactMail } from "./react-mail";
import type { MailConfigurations } from "./types";

/**
 * Create new mailer instance
 */
export function newMailer(
  configurations: MailConfigurations = getMailConfigurations(),
) {
  const { auth, username, password, requireTLS, tls, ...config } =
    configurations;

  log.info("mail", "init", "Initializing mailer");

  return nodemailer.createTransport({
    requireTLS: requireTLS ?? tls,
    auth: auth ?? {
      user: username,
      pass: password,
    },
    ...config,
  });
}

/**
 * Send mail
 */
export async function sendMail({
  configurations,
  from,
  ...options
}: Options & {
  configurations?: Partial<MailConfigurations>;
}) {
  const mailer = newMailer(configurations);

  log.info("mail", "send", "Sending mail");

  const output = await mailer.sendMail({
    ...options,
    from: parseFrom(from),
  });

  if (output.accepted) {
    log.success("mail", "success", "Mail sent successfully");
  } else if (output.rejected) {
    log.error("mail", "rejected", output.response);
  }

  return output;
}

export async function sendReactMail(
  options: Omit<Options, "html"> & {
    render: React.ReactElement;
  } & {
    configurations?: Partial<MailConfigurations>;
  },
) {
  return await sendMail({
    ...options,
    html: renderReactMail(options.render),
  });
}

/**
 * Parse from
 */
function parseFrom(from: Options["from"] = getMailConfigurations().from) {
  return from;
}
