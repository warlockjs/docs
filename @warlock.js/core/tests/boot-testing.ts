import { log } from "@warlock.js/logger";
import {
  disconnectCache,
  disconnectDatabase,
  setupCache,
  setupDatabase,
} from "../bootstrap/setup";
import type { Preload } from "../utils/types";
import { terminateHttpServerTest } from "./create-http-test-application";

export async function bootTesting(opts: { preload?: Preload[] } = {}) {
  log.info("testing", "booting", "Booting testing...");

  const { preload = [] } = opts;

  if (preload.includes("database")) {
    await setupDatabase();
  }

  if (preload.includes("cache")) {
    await setupCache();
  }

  log.success("testing", "booted", "Testing booted successfully.");
}

export async function bootHttpTestingServer() {
  await bootTesting({
    preload: ["database"],
  });
}

export async function terminateTesting() {
  log.info("testing", "terminating", "Terminating testing...");
  await disconnectDatabase();
  await disconnectCache();

  await terminateHttpServerTest();
  log.success("testing", "terminated", "Testing terminated successfully.");
}
