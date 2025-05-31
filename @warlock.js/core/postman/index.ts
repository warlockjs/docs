import { ensureDirectoryAsync } from "@mongez/fs";
import {
  command,
  createAppBuilder,
  createBootstrapFile,
  createConfigLoader,
  createEnvironmentModeDisplayFile,
  executeTsFile,
  loadRoutesFiles,
  warlockPath,
} from "@warlock.js/core";

export * from "./postman-generator";
export * from "./types";

export async function generatePostmanApp() {
  const { addImport, saveAs, addContent } = createAppBuilder();

  await ensureDirectoryAsync(warlockPath());

  const data = await Promise.all([
    createBootstrapFile(),
    createEnvironmentModeDisplayFile(),
    createConfigLoader(),
    loadRoutesFiles(),
  ]);

  addImport(`import { Postman } from "@warlock.js/postman"`);
  addImport(...data);

  addContent(`
  const postman = new Postman();

  postman.generate().then(() => {
    // now stop the server gracefully
    process.exit(0);
  });
  `);

  await saveAs("postman");

  return warlockPath("postman.ts");
}

export async function generatePostman() {
  // first off, we need to collect the routes first
  const file = await generatePostmanApp();

  await executeTsFile(file);
}

export function registerPostmanCommand() {
  return command("postman", "Generate Postman Collection File").action(
    generatePostman,
  );
}
