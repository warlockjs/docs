import { ltrim } from "@mongez/reinforcements";
import {
  createAppBuilder,
  globModuleDirectoryPattern,
} from "../../../builder/app-builder";
import { srcPath } from "./../../../utils/paths";
import { command } from "./../../command-builder";
import { startSeeding } from "./seeder";

export function registerDatabaseSeedsCommand() {
  return command(
    "seed",
    "Run database seeds for all modules, make sure each seeds are in `seeds` directory in any module in `src/app` that you want to run seeds for it. ",
  )
    .option(
      "--once",
      "If set, the seed will be run only for one time even you run this command multiple times.",
    )
    .option(
      "-p --parallel",
      "Run seeds in parallel, this will speed up the seeding process.",
    )
    .option("--fresh", "Clear the previous seeds and run it again.")
    .preload("database")
    .action(async ({ options }) => {
      await startSeeding({
        fresh: options.fresh,
        once: options.once,
        parallel: options.parallel,
      });
    });
}

export async function loadSeedsFiles() {
  const { addImport, saveAs } = createAppBuilder();

  const seedsList = await globModuleDirectoryPattern("seeds/*");

  for (const path of seedsList) {
    const seedsPath = ltrim(ltrim(path, srcPath()).replaceAll("\\", "/"), "/");
    addImport(`import "${seedsPath}"`);
  }

  await saveAs("seeds");

  return `import "./seeds"`;
}
