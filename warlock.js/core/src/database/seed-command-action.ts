import { colors } from "@mongez/copper";
import { DataSource, dataSourceRegistry } from "@warlock.js/cascade";
import { CommandActionData } from "../cli/types";
import { filesOrchestrator } from "../dev-server/files-orchestrator";
import { Path } from "../dev-server/path";
import { getFilesFromDirectory } from "../dev-server/utils";
import { srcPath } from "../utils";
import { Seeder } from "./seeds/seeder";
import { SeedersManager } from "./seeds/seeders.manager";

async function clearAllTables(datasource: DataSource) {
  const tables = await datasource.driver.blueprint.listTables();

  for (const table of tables) {
    await datasource.driver.truncateTable(table, { cascade: true });
  }
}

/**
 * Run database seeds.
 *
 * @example
 * ```ts
 * import { seedCommandAction } from "@warlock.js/core";
 *
 * await seedCommandAction({
 *   command: "seed",
 *   options: { fresh: true, order: false }
 * });
 * ```
 */
export async function seedCommandAction(options: CommandActionData) {
  const { path, fresh, transaction, order } = options.options;

  const datasource = dataSourceRegistry.get();

  if (fresh) {
    await clearAllTables(datasource);
  }

  if (order) {
    const seedFiles = await listSeedsFiles();

    if (seedFiles.length === 0) {
      console.log("No seeds found.");
      return;
    }

    const seedersManager = new SeedersManager();

    seedersManager.register(...seedFiles);

    const seeds = seedersManager.sort().seeders.map((seed) => {
      return {
        name: seed.name,
        order: seed.order,
        enabled: seed.enabled,
      };
    });

    console.table(seeds);

    console.log(
      `Total Seeds: ${colors.blueBright(seeds.length)}, enabled: ${colors.greenBright(seeds.filter((seed) => seed.enabled !== false).length)}, disabled: ${colors.redBright(seeds.filter((seed) => seed.enabled === false).length)}`,
    );
    return;
  }

  const seeds = path
    ? [await loadSeedFile(Path.toAbsolute(path as string))]
    : await listSeedsFiles();

  const seedersManager = new SeedersManager();

  seedersManager.register(...seeds);

  await seedersManager.run(transaction as boolean);
}

async function listSeedsFiles() {
  const seedsFiles = await getFilesFromDirectory(srcPath("app"), "*/seeds/*.ts");

  const seeds = [];

  for (const seedFile of seedsFiles) {
    const seed = await loadSeedFile(seedFile);
    seeds.push(seed);
  }

  return seeds;
}

async function loadSeedFile(absPath: string): Promise<Seeder> {
  const relativePath = Path.toRelative(absPath);
  const seedImport = await filesOrchestrator.load<{ default: Seeder }>(relativePath);

  if (!seedImport || !seedImport.default) {
    throw new Error(`Seeder file ${relativePath} does not export a default seeder.`);
  }

  return seedImport.default;
}
