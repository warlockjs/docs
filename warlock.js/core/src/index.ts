// Initialize Seal with Warlock configuration (localization, etc.)
import { env } from "@mongez/dotenv";
import "./validation/init";

import { colors } from "@mongez/copper";
export * from "@mongez/localization";
export * from "./application";
export * from "./benchmark";
export * from "./bootstrap";
export * from "./bootstrap/setup";
export * from "./cache";
export * from "./cli";
export * from "./config";
export * from "./connectors";
export * from "./container";
export * from "./database";
export * from "./dev-server/files-orchestrator";
export * from "./dev-server/health-checker";
export * from "./encryption";
export * from "./http";
export * from "./image";
export * from "./logger";
export * from "./mail";
export * from "./react";
export * from "./repositories";
export * from "./resource";
export * from "./restful";
export * from "./retry";
export * from "./router";
export * from "./socket";
export * from "./storage";
export * from "./tests";
export * from "./use-cases";
export * from "./utils";
export * from "./validation";
export * from "./warlock-config";

export { colors, env };
