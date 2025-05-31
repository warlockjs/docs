import { loadEnv } from "@mongez/dotenv";
import { initializeDayjs } from "@mongez/time-wizard";
import { captureAnyUnhandledRejection } from "@warlock.js/logger";

export async function bootstrap() {
  loadEnv();
  initializeDayjs();
  captureAnyUnhandledRejection();
}
