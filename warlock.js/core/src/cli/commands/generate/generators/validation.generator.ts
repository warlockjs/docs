import { colors } from "@mongez/copper";
import { putFileAsync } from "@mongez/fs";
import type { CommandActionData } from "../../../types";
import { requestStub, validationStub } from "../templates/stubs";
import { parseModulePath, parseName } from "../utils/name-parser";
import {
  componentExists,
  ensureComponentDirectory,
  moduleExists,
  resolveComponentPath,
} from "../utils/path-resolver";

export async function generateValidation(data: CommandActionData): Promise<void> {
  const input = data.args[0];

  if (!input) {
    console.log(colors.red("Error: Validation name is required"));
    console.log(colors.yellow("Usage: warlock create.validation <module>/<name>"));
    console.log(colors.yellow("Example: warlock create.validation users/create-user"));
    process.exit(1);
  }

  const { module, name: componentName } = parseModulePath(input);

  if (!module) {
    console.log(colors.red("Error: Module name is required"));
    console.log(colors.yellow("Usage: warlock create.validation <module>/<name>"));
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
  const withRequest = data.options.withRequest || data.options.r;

  // Check if schema already exists
  if ((await componentExists(module, "schema", `${name.kebab}.schema`)) && !force) {
    console.log(colors.red(`Error: Schema "${name.kebab}.schema.ts" already exists`));
    console.log(colors.yellow("Use --force to overwrite"));
    process.exit(1);
  }

  // Ensure schema directory exists
  await ensureComponentDirectory(module, "schema");

  // Generate schema
  const schemaPath = resolveComponentPath(module, "schema", `${name.kebab}.schema`);
  const schemaContent = validationStub(name);

  await putFileAsync(schemaPath, schemaContent);
  console.log(colors.green(`✓ Created schema: ${schemaPath}`));

  // Generate request if requested
  if (withRequest) {
    await ensureComponentDirectory(module, "requests");

    const requestPath = resolveComponentPath(module, "requests", `${name.kebab}.request`);
    const requestContent = requestStub(name);

    await putFileAsync(requestPath, requestContent);
    console.log(colors.green(`✓ Created request: ${requestPath}`));
  }

  console.log(colors.cyan(`\n✨ Schema "${name.camel}Schema" generated successfully!`));
}
