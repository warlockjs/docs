import path from "path";

export function internalWarlockPath(relativePath = "") {
  return path.resolve(process.cwd(), "node_modules/.warlock", relativePath);
}

export function internalWarlockConfigPath() {
  return internalWarlockPath("warlock.config.js");
}

export function warlockCorePackagePath(additionalPath = "") {
  return path.resolve(
    process.cwd(),
    "node_modules/@warlock.js/core",
    additionalPath,
  );
}
