import { colors } from "@mongez/copper";
import { putFileAsync } from "@mongez/fs";
import type { CommandActionData } from "../../../types";
import { resourceStub } from "../templates/stubs";
import { parseModulePath, parseName } from "../utils/name-parser";
import {
  componentExists,
  ensureComponentDirectory,
  moduleExists,
  resolveComponentPath,
} from "../utils/path-resolver";

export async function generateResource(data: CommandActionData): Promise<void> {
  const input = data.args[0];

  if (!input) {
    console.log(colors.red("Error: Resource name is required"));
    console.log(colors.yellow("Usage: warlock create.resource <module>/<name>"));
    console.log(colors.yellow("Example: warlock create.resource users/user"));
    process.exit(1);
  }

  const { module, name: componentName } = parseModulePath(input);

  if (!module) {
    console.log(colors.red("Error: Module name is required"));
    console.log(colors.yellow("Usage: warlock create.resource <module>/<name>"));
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

  // Check if resource already exists
  if ((await componentExists(module, "resources", `${name.kebab}.resource`)) && !force) {
    console.log(colors.red(`Error: Resource "${name.kebab}.resource.ts" already exists`));
    console.log(colors.yellow("Use --force to overwrite"));
    process.exit(1);
  }

  // Ensure directories exist
  await ensureComponentDirectory(module, "resources");

  // Generate resource
  const resourcePath = resolveComponentPath(module, "resources", `${name.kebab}.resource`);
  const resourceContent = resourceStub(name);

  await putFileAsync(resourcePath, resourceContent);
  console.log(colors.green(`✓ Created resource: ${resourcePath}`));

  console.log(colors.cyan(`\n✨ Resource "${name.pascal}Resource" generated successfully!`));
}
