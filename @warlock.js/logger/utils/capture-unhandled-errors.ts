import { log } from "../logger";

export function captureAnyUnhandledRejection() {
  process.on("unhandledRejection", (reason: string, promise) => {
    log.error("app", reason, promise);
    console.log(promise);
    // console.trace();
  });

  process.on("uncaughtException", error => {
    log.error("app", "error", error);
    // console.trace();
    console.log(error);
  });
}
