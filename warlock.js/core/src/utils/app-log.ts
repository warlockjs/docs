import { log } from "@warlock.js/logger";

export const appLog = {
  info: (module: string, message: string) => log.info("app", module, message),
  error: (module: string, message: string) => log.error("app", module, message),
  warn: (module: string, message: string) => log.warn("app", module, message),
  debug: (module: string, message: string) => log.debug("app", module, message),
  success: (module: string, message: string) =>
    log.success("app", module, message),
};
