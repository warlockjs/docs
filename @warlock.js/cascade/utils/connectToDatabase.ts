import { getDatabaseConfigurations } from "../config";
import { connection } from "../connection";
import type { DatabaseConfigurations } from "../types";

export function connectToDatabase(
  databaseConfigurations: DatabaseConfigurations = getDatabaseConfigurations(),
) {
  return connection.connect(databaseConfigurations);
}
