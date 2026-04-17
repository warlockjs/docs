import { colors } from "@mongez/copper";
import { putFileAsync } from "@mongez/fs";
import type { CommandActionData } from "../../../types";
import { serviceStub } from "../templates/stubs";
import { parseModulePath, parseName } from "../utils/name-parser";
import {
  componentExists,
  ensureComponentDirectory,
  moduleExists,
  resolveComponentPath,
} from "../utils/path-resolver";

export async function generateService(data: CommandActionData): Promise<void> {
  const input = data.args[0];

  if (!input) {
    console.log(colors.red("Error: Service name is required"));
    console.log(colors.yellow("Usage: warlock create.service <module>/<name>"));
    console.log(colors.yellow("Example: warlock create.service users/create-user"));
    process.exit(1);
  }

  const { module, name: componentName } = parseModulePath(input);

  if (!module) {
    console.log(colors.red("Error: Module name is required"));
    console.log(colors.yellow("Usage: warlock create.service <module>/<name>"));
    process.exit(1);
  }

  // Check if module exists
  if (!(await moduleExists(module))) {
    console.log(colors.red(`Error: Module "${module}" does not exist`));
    console.log(colors.yellow(`Run: warlock create.module ${module}`));
    process.exit(1);
  }

  const name = parseName(componentName);
  const force = data.options.force || data.options.f;

  // Check if service already exists
  if ((await componentExists(module, "services", `${name.kebab}.service`)) && !force) {
    console.log(colors.red(`Error: Service "${name.kebab}.service.ts" already exists`));
    console.log(colors.yellow("Use --force to overwrite"));
    process.exit(1);
  }

  // Ensure directories exist
  await ensureComponentDirectory(module, "services");

  // Generate service
  const servicePath = resolveComponentPath(module, "services", `${name.kebab}.service`);
  const serviceContent = serviceStub(name);

  await putFileAsync(servicePath, serviceContent);
  console.log(colors.green(`✓ Created service: ${servicePath}`));

  console.log(colors.cyan(`\n✨ Service "${name.camel}" generated successfully!`));
}
