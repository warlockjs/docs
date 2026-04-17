import { filesOrchestrator } from "../../dev-server/files-orchestrator";
import { Path } from "../../dev-server/path";
import { typeGenerator } from "../../dev-server/type-generator";
import { getFilesFromDirectory } from "../../dev-server/utils";
import { srcPath } from "../../utils";
import { command } from "../cli-command";

export const typingsGeneratorCommand = command({
  name: "generate.typings",
  description: "Generate type definitions for the project",
  options: [
    {
      text: "--files, -f",
      description:
        "Files to generate typings for, if not passed, it will generate typings for all files",
    },
  ],
  action: async ({ options }) => {
    const configFilesPaths: string[] = [];
    if (options.files) {
      const files = String(options.files)
        .split(",")
        .map((file) => {
          if (file.startsWith("./")) {
            return Path.toAbsolute(file);
          }

          return file;
        });

      if (files?.length) {
        configFilesPaths.push(...files);
      }
    }

    if (configFilesPaths.length === 0) {
      // grab all config files
      const configFiles = await getFilesFromDirectory(srcPath("config"));
      configFilesPaths.push(...configFiles);
    }

    const results = await Promise.allSettled(
      configFilesPaths.map((path) => filesOrchestrator.add(Path.toRelative(path))),
    );

    const failed = results.filter((r) => r.status === "rejected");

    if (failed.length) {
      console.warn(`Failed to process ${failed.length} files`);
    }

    await typeGenerator.generateAll();
  },
});
