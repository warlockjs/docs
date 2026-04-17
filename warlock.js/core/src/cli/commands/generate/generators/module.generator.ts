import { colors } from "@mongez/copper";
import { ensureDirectoryAsync, putFileAsync } from "@mongez/fs";
import path from "node:path";
import { appPath } from "../../../../utils";
import type { CommandActionData } from "../../../types";
import {
  crudCreateControllerStub,
  crudCreateServiceStub,
  crudCreateValidationStub,
  crudDeleteControllerStub,
  crudDeleteServiceStub,
  crudGetServiceStub,
  crudListControllerStub,
  crudListServiceStub,
  crudModelStub,
  crudRepositoryStub,
  crudResourceStub,
  crudRoutesStub,
  crudSeedStub,
  crudShowControllerStub,
  crudUpdateControllerStub,
  crudUpdateServiceStub,
  crudUpdateValidationStub,
  requestStub,
} from "../templates/stubs";
import { pluralName, singularName } from "../utils/name-parser";
import { moduleExists } from "../utils/path-resolver";
import { createMigrationFile } from "./migration.generator";

export async function generateModule(data: CommandActionData): Promise<void> {
  const moduleName = data.args[0];

  if (!moduleName) {
    console.log(colors.red("Error: Module name is required"));
    console.log(colors.yellow("Usage: warlock generate.module <name> [options]"));
    console.log(colors.yellow("Example: warlock generate.module products"));
    console.log(colors.yellow("         warlock generate.module products --crud"));
    process.exit(1);
  }

  const name = pluralName(moduleName);
  const force = data.options.force || data.options.f;
  const withCrud = data.options.crud || data.options.c;

  // Check if module already exists
  if ((await moduleExists(name.kebab)) && !force) {
    console.log(colors.red(`Error: Module "${name.kebab}" already exists`));
    console.log(colors.yellow("Use --force to overwrite"));
    process.exit(1);
  }

  const modulePath = appPath(name.kebab);

  // Create module directory structure
  const directories = [
    "controllers",
    "services",
    "models",
    "repositories",
    "schema",
    "requests",
    "resources",
    "events",
    "types",
    "utils",
  ];

  for (const dir of directories) {
    await ensureDirectoryAsync(path.join(modulePath, dir));
  }

  console.log(colors.green(`✓ Created module structure`));

  // Create main.ts
  const mainContent = `// You may use this file as a custom entry point to be executed when the app starts.
// it runs only once, and you don't need to import the routes.ts file, it will be imported automatically.
// Use it to regsiter or boot up any custom logic for this module.
`;
  await putFileAsync(path.join(modulePath, "main.ts"), mainContent);
  console.log(colors.green(`✓ Created main.ts`));

  // Create routes.ts
  const routesContent = withCrud
    ? crudRoutesStub(name)
    : `import { router } from "@warlock.js/core";
import { guarded } from "app/shared/utils/router";

// Define your routes here
// Example:
// router.get("/${name.kebab}", listController);
`;
  await putFileAsync(path.join(modulePath, "routes.ts"), routesContent);
  console.log(colors.green(`✓ Created routes.ts`));

  // Create utils/locales.ts
  const localesContent = `import { groupedTranslations } from "@mongez/localization";

groupedTranslations("${name.camel}", {
  // Add your translations here
  // Example:
  // welcome: {
  //   en: "Welcome",
  //   ar: "مرحبا",
  // },
});
`;
  await putFileAsync(path.join(modulePath, "utils", "locales.ts"), localesContent);
  console.log(colors.green(`✓ Created utils/locales.ts`));

  // If --crud flag is set, generate full CRUD scaffold
  if (withCrud) {
    const entity = singularName(moduleName);

    // Create controllers
    await putFileAsync(
      path.join(modulePath, "controllers", `create-${entity.kebab}.controller.ts`),
      crudCreateControllerStub(entity),
    );
    console.log(colors.green(`✓ Created create-${entity.kebab}.controller.ts`));

    await putFileAsync(
      path.join(modulePath, "controllers", `update-${entity.kebab}.controller.ts`),
      crudUpdateControllerStub(entity),
    );
    console.log(colors.green(`✓ Created update-${entity.kebab}.controller.ts`));

    await putFileAsync(
      path.join(modulePath, "controllers", `list-${name.kebab}.controller.ts`),
      crudListControllerStub(name),
    );
    console.log(colors.green(`✓ Created list-${name.kebab}.controller.ts`));

    await putFileAsync(
      path.join(modulePath, "controllers", `get-${entity.kebab}.controller.ts`),
      crudShowControllerStub(entity),
    );
    console.log(colors.green(`✓ Created get-${entity.kebab}.controller.ts`));

    await putFileAsync(
      path.join(modulePath, "controllers", `delete-${entity.kebab}.controller.ts`),
      crudDeleteControllerStub(entity),
    );
    console.log(colors.green(`✓ Created delete-${entity.kebab}.controller.ts`));

    // Create schema files
    await putFileAsync(
      path.join(modulePath, "schema", `create-${entity.kebab}.schema.ts`),
      crudCreateValidationStub(entity),
    );
    console.log(colors.green(`✓ Created create-${entity.kebab}.schema.ts`));

    await putFileAsync(
      path.join(modulePath, "schema", `update-${entity.kebab}.schema.ts`),
      crudUpdateValidationStub(entity),
    );
    console.log(colors.green(`✓ Created update-${entity.kebab}.schema.ts`));

    // Create request types
    const createRequestName = singularName(`create-${entity.kebab}`);
    await putFileAsync(
      path.join(modulePath, "requests", `create-${entity.kebab}.request.ts`),
      requestStub(createRequestName),
    );
    console.log(colors.green(`✓ Created create-${entity.kebab}.request.ts`));

    const updateRequestName = singularName(`update-${entity.kebab}`);
    await putFileAsync(
      path.join(modulePath, "requests", `update-${entity.kebab}.request.ts`),
      requestStub(updateRequestName),
    );
    console.log(colors.green(`✓ Created update-${entity.kebab}.request.ts`));

    // Create model
    await ensureDirectoryAsync(path.join(modulePath, "models", entity.kebab));
    await putFileAsync(
      path.join(modulePath, "models", entity.kebab, `${entity.kebab}.model.ts`),
      crudModelStub(entity),
    );
    console.log(colors.green(`✓ Created ${entity.kebab}.model.ts`));

    // Create model index
    await putFileAsync(
      path.join(modulePath, "models", entity.kebab, "index.ts"),
      `export * from "./${entity.kebab}.model";\n`,
    );

    // Create migrations folder
    await ensureDirectoryAsync(path.join(modulePath, "models", entity.kebab, "migrations"));

    // Create resource
    await putFileAsync(
      path.join(modulePath, "resources", `${entity.kebab}.resource.ts`),
      crudResourceStub(name),
    );
    console.log(colors.green(`✓ Created ${entity.kebab}.resource.ts`));

    // Create repository
    await putFileAsync(
      path.join(modulePath, "repositories", `${name.kebab}.repository.ts`),
      crudRepositoryStub(name),
    );
    console.log(colors.green(`✓ Created ${name.kebab}.repository.ts`));

    // Create services
    await putFileAsync(
      path.join(modulePath, "services", `create-${entity.kebab}.service.ts`),
      crudCreateServiceStub(entity),
    );
    console.log(colors.green(`✓ Created create-${entity.kebab}.service.ts`));

    await putFileAsync(
      path.join(modulePath, "services", `update-${entity.kebab}.service.ts`),
      crudUpdateServiceStub(entity),
    );
    console.log(colors.green(`✓ Created update-${entity.kebab}.service.ts`));

    await putFileAsync(
      path.join(modulePath, "services", `list-${name.kebab}.service.ts`),
      crudListServiceStub(name),
    );
    console.log(colors.green(`✓ Created list-${name.kebab}.service.ts`));

    await putFileAsync(
      path.join(modulePath, "services", `get-${entity.kebab}.service.ts`),
      crudGetServiceStub(entity),
    );
    console.log(colors.green(`✓ Created get-${entity.kebab}.service.ts`));

    await putFileAsync(
      path.join(modulePath, "services", `delete-${entity.kebab}.service.ts`),
      crudDeleteServiceStub(entity),
    );
    console.log(colors.green(`✓ Created delete-${entity.kebab}.service.ts`));

    // Create seeds
    await ensureDirectoryAsync(path.join(modulePath, "seeds"));
    await putFileAsync(path.join(modulePath, "seeds", `${name.kebab}.seed.ts`), crudSeedStub(name));
    console.log(colors.green(`✓ Created ${name.kebab}.seed.ts`));

    // Create migration
    await createMigrationFile(name.kebab, entity.kebab);
  }

  console.log(colors.cyan(`\n✨ Module "${name.kebab}" generated successfully!`));

  if (withCrud) {
    console.log(colors.gray(`\n📦 CRUD scaffold created with:`));
    console.log(colors.gray(`  - List, Get, Create & Update controllers`));
    console.log(colors.gray(`  - Repository`));
    console.log(colors.gray(`  - Validation schemas in schema/`));
    console.log(colors.gray(`  - Request types`));
    console.log(colors.gray(`  - Model with resource`));
    console.log(colors.gray(`  - Routes configured`));
    console.log(colors.gray(`\nNext steps:`));
    console.log(
      colors.gray(`  1. Update model schema in models/${name.kebab}/${name.kebab}.model.ts`),
    );
    console.log(colors.gray(`  2. Update schema rules in schema/*.schema.ts`));
    console.log(
      colors.gray(`  3. Create migration: warlock generate.model ${name.kebab}/${name.kebab}`),
    );
  } else {
    console.log(colors.gray(`\nNext steps:`));
    console.log(colors.gray(`  1. Define routes in ${name.kebab}/routes.ts`));
    console.log(
      colors.gray(`  2. Create controllers: warlock generate.controller ${name.kebab}/<name>`),
    );
    console.log(colors.gray(`  3. Create models: warlock generate.model ${name.kebab}/<name>`));
    console.log(colors.gray(`\nTip: Use --crud flag to generate a full CRUD scaffold`));
  }
}
