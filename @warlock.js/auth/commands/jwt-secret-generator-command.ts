import { command } from "@warlock.js/core";
import { generateJWTSecret } from "../services/generate-jwt-secret";

export function registerJWTSecretGeneratorCommand() {
  return command("jwt.generate").action(generateJWTSecret);
}
