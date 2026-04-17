import { colors } from "@mongez/copper";
import { ensureDirectoryAsync, putFileAsync } from "@mongez/fs";
import path from "node:path";
import { appPath } from "../../../../utils";
import type { CommandActionData } from "../../../types";
import { migrationAlterStub, migrationStub } from "../templates/stubs";
import { parseColumnDsl } from "./column-dsl-parser";
import { parseName } from "../utils/name-parser";

/**
 * Generate a migration file for a model
 */
/**
 * Create a migration file for a model
 */
export async function createMigrationFile(moduleName: string, entityName: string, options: any = {}) {
  const entity = parseName(entityName);

  // Generate timestamp: MM-DD-YYYY_HH-MM-SS
  const now = new Date();
  const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;

  const migrationFileName = `${timestamp}-${entity.kebab}.migration.ts`;
  const migrationsPath = path.join(appPath(), moduleName, "models", entity.kebab, "migrations");

  // Ensure migrations directory exists
  await ensureDirectoryAsync(migrationsPath);

  const addParams = options.add as string;
  const dropParams = options.drop as string;
  const renameParams = options.rename as string;
  const timestamps = options.timestamps !== "false" && options.timestamps !== false;

  let migrationContent = "";

  if (addParams || dropParams || renameParams) {
    // Generate alter stub
    const parsedAdd = parseColumnDsl(addParams || "");
    const helpersSet = new Set<string>();
    
    const addLines = parsedAdd.map((col) => {
      helpersSet.add(col.helper);
      return `    ${col.name}: ${col.helper}()${col.modifiers.join("")},`;
    });

    let formattedDrop: string | undefined = undefined;
    if (dropParams) {
      formattedDrop = JSON.stringify(dropParams.split(",").map((s) => s.trim()));
    }

    let formattedRename: string | undefined = undefined;
    if (renameParams) {
      const obj: Record<string, string> = {};
      renameParams.split(",").map((s) => s.trim()).forEach((p) => {
        const [oldN, newN] = p.split(":").map((s) => s.trim());
        if (oldN && newN) obj[oldN] = newN;
      });
      formattedRename = JSON.stringify(obj, null, 2).replace(/\n/g, '\n  ');
    }

    migrationContent = migrationAlterStub(entity, {
      add: addLines.length > 0 ? addLines.join("\n") : undefined,
      drop: formattedDrop,
      rename: formattedRename,
      imports: Array.from(helpersSet),
    });
  } else {
    // Generate create stub
    migrationContent = migrationStub(entity, {
      timestamps,
    });
  }

  // Create migration file
  const migrationFilePath = path.join(migrationsPath, migrationFileName);
  await putFileAsync(migrationFilePath, migrationContent);

  console.log(colors.green(`✓ Created ${migrationFileName}`));
  return migrationFilePath;
}

/**
 * Generate a migration file for a model
 */
export async function generateMigration(data: CommandActionData) {
  const modelPath = data.args[0] as string;

  if (!modelPath) {
    console.log(colors.red("Error: Model path is required"));
    console.log(colors.gray("Usage: warlock gen.migration <model-path>"));
    console.log(colors.gray("Example: warlock gen.migration products/product"));
    return;
  }

  // Parse model path (e.g., "products/product")
  const [moduleName, entityName] = modelPath.split("/");

  if (!moduleName || !entityName) {
    console.log(colors.red("Error: Invalid model path format. Expected: <module>/<entity>"));
    console.log(colors.gray("Example: warlock gen.migration products/product"));
    return;
  }

  const migrationFilePath = await createMigrationFile(moduleName, entityName, data.options);

  console.log(
    colors.cyan(`\n✨ Migration file created at: ${path.relative(appPath(), migrationFilePath)}`),
  );
}
