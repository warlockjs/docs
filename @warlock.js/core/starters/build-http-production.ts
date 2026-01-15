import { colors } from "@mongez/copper";
import esbuild from "esbuild";
import path from "path";
import { buildHttpApp } from "../builder/build-http-app";
import { getWarlockConfig } from "../config/get-warlock-config";
import { command } from "../console/command-builder";
import { nativeNodeModulesPlugin } from "./../esbuild";

export async function buildHttpForProduction() {
  const now = performance.now();
  console.log(colors.cyan("Building HTTP server for production..."));

  console.log(colors.yellow("Scanning project files..."));

  const httpPath = await buildHttpApp();

  const config = getWarlockConfig();

  console.log(colors.magenta("Bundling project files..."));

  await esbuild.build({
    platform: "node",
    entryPoints: [httpPath],
    bundle: true,
    packages: "external",
    minify: true,
    legalComments: "linked",
    target: ["esnext"],
    format: "esm",
    sourcemap: config.build.sourcemap,
    outfile: path.resolve(config.build.outDirectory, config.build.outFile),
    plugins: [nativeNodeModulesPlugin],
  });

  console.log(
    colors.green(
      `Project has been built in ${Math.floor(performance.now() - now)}ms`,
    ),
  );

  console.log(
    colors.cyan('You can now run "warlock start" to start the server.'),
  );
}

export function registerProductionBuildCommand() {
  return command("build").action(buildHttpForProduction);
}
