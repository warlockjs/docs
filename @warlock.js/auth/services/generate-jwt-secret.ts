import { fileExists, getFile, putFile } from "@mongez/fs";
import { Random } from "@mongez/reinforcements";
import { environment, rootPath } from "@warlock.js/core";
import { log } from "@warlock.js/logger";

export async function generateJWTSecret() {
  let envFile = rootPath(".env");

  log.info("jwt", "generating", "Generating jwt secret");

  const environmentMode = environment();

  if (!fileExists(envFile)) {
    const envFileType =
      environmentMode === "production" ? ".env.production" : ".env.development";
    envFile = rootPath(envFileType);
  }

  if (!fileExists(envFile)) {
    log.error("jwt", "error", ".env file not found");
    return;
  }

  let contents = getFile(envFile);

  if (contents.includes("JWT_SECRET")) {
    log.warn("jwt", "exists", "JWT secret already exists in the .env file.");
    return;
  }

  const key = Random.string(32);

  contents += `

# JWT Secret
JWT_SECRET=${key}
`;

  putFile(envFile, contents);

  log.success(
    "jwt",
    "generated",
    `JWT secret key generated and added to the .env file.`,
  );
}
