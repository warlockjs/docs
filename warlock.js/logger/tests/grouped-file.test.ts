import logger, { ConsoleLog, FileLog, log } from "../src";

describe("@mongez/logger/file-log", () => {
  beforeAll(() => {
    logger.setChannels([
      new ConsoleLog(),
      new FileLog({
        storagePath: process.cwd() + "/storage/logs",
        groupBy: ["module", "level"],
        dateFormat: {
          date: "DD-MM-YYYY",
        },
      }),
    ]);
  });

  it(
    "Should group logs by module and level",
    async () => {
      for (let i = 0; i < 1000; i++) {
        if (i % 2 === 0) {
          log.info("app", "boot", "Adding Message " + i);
        } else if (i % 3 === 0) {
          log.warn("app", "boot", "Adding Message " + i);
        } else if (i % 5 === 0) {
          log.error("app", "boot", "Adding Message " + i);
        } else if (i % 7 === 0) {
          log.debug("app", "boot", "Adding Message " + i);
        } else {
          log("app", "boot", "Adding Message " + i, "warn");
        }
      }

      // wait for 10 minutes to stop the test from tearing down
      await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 10));
    },
    1000 * 60 * 60 * 2
  );
});
