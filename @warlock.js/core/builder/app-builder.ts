import { colors } from "@mongez/copper";
import { ensureDirectory, fileExistsAsync, putFileAsync } from "@mongez/fs";
import { ltrim, rtrim } from "@mongez/reinforcements";
import { ConsoleLog } from "@warlock.js/logger";
import glob from "fast-glob";
import prettier from "prettier";
import { transpile } from "../esbuild/transpile";
import { appPath, srcPath, warlockPath } from "../utils";

const resolveWinPath = (path: string) => path.replace(/\\/g, "/");

export async function globModule(fileName: string) {
  fileName += ".ts";

  const pathPattern = resolveWinPath(appPath(`**/${fileName}`));

  const paths = await glob([pathPattern], {
    dot: false,
  });

  const resolvedAppPath = resolveWinPath(appPath());

  return paths.map(path => {
    return "app/" + rtrim(ltrim(path.replace(resolvedAppPath, ""), "/"), ".ts");
  });
}

export async function globModuleDirectoryPattern(pattern: string) {
  const pathPattern = resolveWinPath(appPath(`**/${pattern}`));

  const paths = await glob([pathPattern], {
    dot: false,
  });

  const resolvedAppPath = resolveWinPath(appPath());

  return paths.map(path => {
    return "app/" + rtrim(ltrim(path.replace(resolvedAppPath, ""), "/"), ".ts");
  });
}

export async function globModuleDirectory(directory: string) {
  return globModuleDirectoryPattern(`${directory}/*.ts`);
}

export function ensureWarlockPath() {
  ensureDirectory(warlockPath());
}

export async function createWarlockFile(filePath: string, content: string) {
  await putFileAsync(
    warlockPath(filePath),
    await prettier.format(content, {
      parser: "typescript",
    }),
  );
}

export function createAppBuilder() {
  const imports: string[] = [];
  const contents: string[] = [];

  const importsToString = () => {
    return imports.join("\n");
  };

  const contentsToString = () => {
    return "\n" + contents.join("\n");
  };

  const getContent = () => {
    return importsToString() + contentsToString();
  };

  const saveAs = async (fileName: string) => {
    fileName += ".ts";

    await createWarlockFile(fileName, getContent());
    return fileName;
  };

  const transpileFile = async (fileName: string) => {
    // Don't save again, just transpile the existing file
    const tsFile = fileName + ".ts";
    const jsFile = fileName + ".js";
    return await transpile(warlockPath(tsFile), jsFile);
  };

  const execute = async (fileName: string) => {
    const file = await transpileFile(fileName);
    await import(file);
  };

  return {
    addContent(content: string) {
      contents.push(content);
    },
    addImport(...importsList: string[]) {
      imports.push(...importsList);
    },
    async addImportPath(path: string) {
      if (!path.endsWith(".ts") && !path.endsWith(".tsx")) {
        path += ".ts";
      }

      if (await fileExistsAsync(srcPath(path))) {
        imports.push(`import "${rtrim(path, ".ts")}"`);
      }
    },
    saveAs,
    transpile: transpileFile,
    execute,
  };
}

export async function createBootstrapFile() {
  if (await fileExistsAsync(warlockPath("bootstrap.ts"))) {
    return "import './bootstrap'";
  }

  await createWarlockFile(
    "bootstrap.ts",
    `import { bootstrap } from "@warlock.js/core";\n bootstrap();`,
  );

  return "import './bootstrap'";
}

export async function createEnvironmentModeDisplayFile() {
  if (await fileExistsAsync(warlockPath("environment.ts"))) {
    return "import './environment'";
  }

  await createWarlockFile(
    "environment.ts",
    `import { displayEnvironmentMode } from "@warlock.js/core";\n displayEnvironmentMode();`,
  );

  return "import './environment'";
}

export async function loadMainFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  // First add the root main file
  await addImportPath("main.ts");

  // Then add all module main files
  const paths = await globModule("main");

  // Add each main file as an import
  await Promise.all(
    paths.map(async path => {
      await addImportPath(path);
    }),
  );

  return await saveAs("main");
}

export async function loadLocalesFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  const paths = await globModule("utils/locales");

  await Promise.all(
    paths.map(async path => {
      await addImportPath(path);
    }),
  );

  return await saveAs("locales");
}

export async function loadEventFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  const paths = await globModuleDirectory("events");

  const consoleLog = new ConsoleLog();

  // raise a warning if there is an index file inside the events directory
  for (const path of paths) {
    if (path.includes("index")) {
      consoleLog.log({
        module: "optimizer",
        action: "events",
        message: `${colors.gold(path)} found in the events directory, please remove it as it will be ignored in the next release of warlock`,
        type: "warn",
      });
    }
  }

  await Promise.all(
    paths.map(async path => {
      await addImportPath(path);
    }),
  );

  return await saveAs("events");
}

export async function loadRoutesFiles() {
  const { addImportPath, saveAs } = createAppBuilder();

  const paths = await globModule("routes");

  await Promise.all(
    paths.map(async path => {
      await addImportPath(path);
    }),
  );

  return await saveAs("routes");
}
