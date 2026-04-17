import { ProductionBuilder } from "./production-builder";

/**
 * Build the application for production
 * Options are loaded from warlock.config.ts
 */
export async function buildAppProduction() {
  const builder = new ProductionBuilder();
  await builder.build();
}
