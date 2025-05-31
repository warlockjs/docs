import type { OnLoadArgs, OnResolveArgs, Plugin, PluginBuild } from "esbuild";
import fs from "fs";
import path from "path";

export * from "./execute-ts-file";
export * from "./plugins";

export { startServerPlugin } from "./plugins";

export const buildReporterPlugin: Plugin = {
  name: "build-reporter",
  setup(build) {
    build.onEnd(result => {
      if (result.errors.length > 0) {
        console.error("Build failed:", result.errors);
        return;
      }

      if (!result.metafile) return;

      // Log which chunks were rebuilt
      const outputs = result.metafile.outputs;
      const rebuiltChunks = Object.keys(outputs).map(file =>
        path.basename(file),
      );

      console.log("Rebuilt chunks:", rebuiltChunks.join(", "));

      // Log total size
      const totalBytes = Object.values(outputs).reduce(
        (sum, output) => sum + (output.bytes || 0),
        0,
      );

      console.log(`Total size: ${(totalBytes / 1024).toFixed(2)}KB`);
    });
  },
};

export const injectImportPathPlugin = (): Plugin => ({
  name: "inject-import-path",
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async args => {
      const source = await fs.promises.readFile(args.path, "utf8");
      const relativePath = path
        .relative(process.cwd(), args.path)
        .replace(/\\/g, "/");

      const modifiedSource = appendImportPath(source, relativePath);

      return {
        contents: modifiedSource,
        loader: "tsx",
      };
    });
  },
});

function appendImportPath(code: string, relativePath: string): string {
  // Regex to find the component name from "export default function ComponentName"
  const componentNameRegex = /export default function (\w+)/;
  const match = code.match(componentNameRegex);

  if (!match) return code;

  const componentName = match[1];
  return `${code}\n${componentName}.__importPath = '${relativePath}';`;
}

export const nativeNodeModulesPlugin = {
  name: "native-node-modules",
  setup(build: PluginBuild) {
    build.onResolve(
      { filter: /\.node$/, namespace: "file" },
      (args: OnResolveArgs) => ({
        path: require.resolve(args.path, { paths: [args.resolveDir] }),
        namespace: "node-file",
      }),
    );

    build.onLoad(
      { filter: /.*/, namespace: "node-file" },
      (args: OnLoadArgs) => ({
        contents: `
          import path from ${JSON.stringify(args.path)}
          try { module.exports = require(path) }
          catch {}
        `,
      }),
    );

    build.onResolve(
      { filter: /\.node$/, namespace: "node-file" },
      (args: OnResolveArgs) => ({
        path: args.path,
        namespace: "file",
      }),
    );

    const opts = build.initialOptions;
    opts.loader = opts.loader || {};
    opts.loader[".node"] = "file";
  },
};
