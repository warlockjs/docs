// import nodemon from "nodemon";
import esbuild from "esbuild";
import { srcPath, warlockPath } from "../utils";
import { nativeNodeModulesPlugin } from "./../esbuild";

export async function transpile(file: string, exportAs: string) {
  const outfile = warlockPath(exportAs);
  await esbuild.build({
    platform: "node",
    entryPoints: [file],
    bundle: false,
    minify: false,
    packages: "external",
    outfile,
    sourcemap: "linked",
    sourceRoot: srcPath(),
    format: "esm",
    target: ["esnext"],
    plugins: [nativeNodeModulesPlugin],
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    mainFields: ["module", "main"],
    keepNames: true,
  });

  return outfile;
}
