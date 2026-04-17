import { colors } from "@mongez/copper";
import { putFileAsync } from "@mongez/fs";
import type { CommandActionData } from "../../../types";
import { repositoryStub } from "../templates/stubs";
import { parseModulePath, parseName } from "../utils/name-parser";
import {
  componentExists,
  ensureComponentDirectory,
  moduleExists,
  resolveComponentPath,
} from "../utils/path-resolver";

export async function generateRepository(data: CommandActionData): Promise<void> {
  const input = data.args[0];

  if (!input) {
    console.log(colors.red("Error: Repository name is required"));
    console.log(colors.yellow("Usage: warlock create.repository <module>/<name>"));
    console.log(colors.yellow("Example: warlock create.repository users/user"));
    process.exit(1);
  }

  const { module, name: componentName } = parseModulePath(input);

  if (!module) {
    console.log(colors.red("Error: Module name is required"));
    console.log(colors.yellow("Usage: warlock create.repository <module>/<name>"));
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

  // Check if repository already exists
  if ((await componentExists(module, "repositories", `${name.kebab}.repository`)) && !force) {
    console.log(colors.red(`Error: Repository "${name.kebab}.repository.ts" already exists`));
    console.log(colors.yellow("Use --force to overwrite"));
    process.exit(1);
  }

  // Ensure directories exist
  await ensureComponentDirectory(module, "repositories");

  // Generate repository
  const repositoryPath = resolveComponentPath(module, "repositories", `${name.kebab}.repository`);
  const repositoryContent = repositoryStub(name);

  await putFileAsync(repositoryPath, repositoryContent);
  console.log(colors.green(`✓ Created repository: ${repositoryPath}`));

  console.log(colors.cyan(`\n✨ Repository "${name.pascal}Repository" generated successfully!`));
}
