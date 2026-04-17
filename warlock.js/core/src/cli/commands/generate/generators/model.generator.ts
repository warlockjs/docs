import { colors } from "@mongez/copper";
import { ensureDirectoryAsync, putFileAsync } from "@mongez/fs";
import path from "node:path";
import type { CommandActionData } from "../../../types";
import { migrationStub, modelStub } from "../templates/stubs";
import { parseModulePath, singularName } from "../utils/name-parser";
import { componentExists, moduleExists, resolveModulePath } from "../utils/path-resolver";

export async function generateModel(data: CommandActionData): Promise<void> {
  const input = data.args[0];

  if (!input) {
    console.log(colors.red("Error: Model name is required"));
    console.log(colors.yellow("Usage: warlock create.model <module>/<name>"));
    console.log(colors.yellow("Example: warlock create.model users/user"));
    process.exit(1);
  }

  const { module, name: componentName } = parseModulePath(input);

  if (!module) {
    console.log(colors.red("Error: Module name is required"));
    console.log(colors.yellow("Usage: warlock create.model <module>/<name>"));
    process.exit(1);
  }

  // Check if module exists
  if (!(await moduleExists(module))) {
    console.log(colors.red(`Error: Module "${module}" does not exist`));
    console.log(colors.yellow(`Run: warlock create.module ${module}`));
    process.exit(1);
  }

  const name = singularName(componentName);
  const force = data.options.force || data.options.f;
  const withResource = data.options.withResource || data.options.rs;
  const tableName = (data.options.table as string) || `${name.snake}s`;

  // Check if model already exists
  const modelDir = path.join(resolveModulePath(module), "models", name.kebab);
  const modelPath = path.join(modelDir, `${name.kebab}.model.ts`);

  if ((await componentExists(module, `models/${name.kebab}`, `${name.kebab}.model`)) && !force) {
    console.log(colors.red(`Error: Model "${name.kebab}" already exists`));
    console.log(colors.yellow("Use --force to overwrite"));
    process.exit(1);
  }

  // Ensure directories exist
  await ensureDirectoryAsync(modelDir);
  await ensureDirectoryAsync(path.join(modelDir, "migrations"));

  // Generate model
  const modelContent = modelStub(name, { tableName, withResource: !!withResource });
  await putFileAsync(modelPath, modelContent);
  console.log(colors.green(`✓ Created model: ${modelPath}`));

  // Generate index.ts
  const indexContent = `export * from "./${name.kebab}.model";
`;
  await putFileAsync(path.join(modelDir, "index.ts"), indexContent);
  console.log(colors.green(`✓ Created index.ts`));

  // Generate migration
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "_").split(".")[0];
  const migrationPath = path.join(
    modelDir,
    "migrations",
    `${timestamp}_${name.kebab}.migration.ts`,
  );

  const migrationContent = migrationStub(name, {
    timestamps: data.options.timestamps !== "false" && data.options.timestamps !== false,
  });

  await putFileAsync(migrationPath, migrationContent);
  console.log(colors.green(`✓ Created migration: ${migrationPath}`));

  console.log(colors.cyan(`\n✨ Model "${name.pascal}" generated successfully!`));
  console.log(colors.gray(`\nNext steps:`));
  console.log(colors.gray(`  1. Update model schema in ${name.kebab}.model.ts`));
  console.log(
    colors.gray(`  2. Update migration in migrations/${timestamp}_${name.kebab}.migration.ts`),
  );
  console.log(colors.gray(`  3. Run migration: warlock migrate`));
}
