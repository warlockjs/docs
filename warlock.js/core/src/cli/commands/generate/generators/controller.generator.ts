import { colors } from "@mongez/copper";
import { putFileAsync } from "@mongez/fs";
import type { CommandActionData } from "../../../types";
import { controllerStub, requestStub, validationStub } from "../templates/stubs";
import { parseModulePath, parseName } from "../utils/name-parser";
import {
  componentExists,
  ensureComponentDirectory,
  moduleExists,
  resolveComponentPath,
} from "../utils/path-resolver";

export async function generateController(data: CommandActionData): Promise<void> {
  const input = data.args[0];

  if (!input) {
    console.log(colors.red("Error: Controller name is required"));
    console.log(colors.yellow("Usage: warlock create.controller <module>/<name>"));
    console.log(colors.yellow("Example: warlock create.controller users/create-user"));
    process.exit(1);
  }

  const { module, name: componentName } = parseModulePath(input);

  if (!module) {
    console.log(colors.red("Error: Module name is required"));
    console.log(colors.yellow("Usage: warlock create.controller <module>/<name>"));
    process.exit(1);
  }

  // Check if module exists
  if (!(await moduleExists(module))) {
    console.log(colors.red(`Error: Module "${module}" does not exist`));
    console.log(colors.yellow(`Run: warlock create.module ${module}`));
    process.exit(1);
  }

  const name = parseName(componentName);
  const withValidation = data.options.withValidation || data.options.v;
  const force = data.options.force || data.options.f;

  // Check if controller already exists
  const controllerPath = resolveComponentPath(module, "controllers", `${name.kebab}.controller`);
  if ((await componentExists(module, "controllers", `${name.kebab}.controller`)) && !force) {
    console.log(colors.red(`Error: Controller "${name.kebab}.controller.ts" already exists`));
    console.log(colors.yellow("Use --force to overwrite"));
    process.exit(1);
  }

  // Ensure directories exist
  await ensureComponentDirectory(module, "controllers");

  // Generate controller
  const controllerContent = controllerStub(name, { withValidation: !!withValidation });
  await putFileAsync(controllerPath, controllerContent);
  console.log(colors.green(`✓ Created controller: ${controllerPath}`));

  // Generate schema and request if requested
  if (withValidation) {
    await ensureComponentDirectory(module, "schema");
    await ensureComponentDirectory(module, "requests");

    const schemaPath = resolveComponentPath(module, "schema", `${name.kebab}.schema`);
    const requestPath = resolveComponentPath(module, "requests", `${name.kebab}.request`);

    const schemaContent = validationStub(name);
    const requestContent = requestStub(name);

    await putFileAsync(schemaPath, schemaContent);
    await putFileAsync(requestPath, requestContent);

    console.log(colors.green(`✓ Created schema: ${schemaPath}`));
    console.log(colors.green(`✓ Created request: ${requestPath}`));
  }

  console.log(colors.cyan(`\n✨ Controller "${name.camel}" generated successfully!`));
}
