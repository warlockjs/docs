import { log } from "../logger";

export function captureAnyUnhandledRejection() {
  process.on("unhandledRejection", (reason: any, promise) => {
    log.error("app", "unhandledRejection", reason);
    console.log(promise);
    // console.trace();
  });

  process.on("uncaughtException", error => {
    log.error("app", "uncaughtException", error);
    // console.trace();
    console.log(error);
  });
}
