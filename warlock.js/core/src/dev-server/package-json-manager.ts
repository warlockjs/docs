import { getJsonFileAsync } from "@mongez/fs";
import { Path } from "./path";

export class PackageJsonManager {
  /**
   * Package.json data
   */
  public packageJson: any = {};

  /**
   * Initialize the package.json manager
   */
  public async init() {
    this.packageJson = await getJsonFileAsync(Path.toAbsolute("package.json"));
  }

  /**
   * Check if the given path is a package path
   */
  public isPathPackage(path: string) {
    const allPackages = Object.keys(this.packageJson.dependencies || {}).concat(
      Object.keys(this.packageJson.devDependencies || {}),
    );

    return allPackages.some((packageName) => path.startsWith(packageName));
  }
}

export const packageJsonManager = new PackageJsonManager();
