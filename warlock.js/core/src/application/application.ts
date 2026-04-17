import { environment, setEnvironment, type Environment } from "../utils/environment";
import { getFrameworkVersion } from "../utils/framework-vesion";
import { appPath, publicPath, rootPath, srcPath, storagePath, uploadsPath } from "../utils/paths";

export class Application {
  /**
   * Project start time regarding the process start time
   */
  public static readonly startedAt = new Date(Date.now() - process.uptime() * 1000);

  /**
   * Runtime strategy
   */
  public static runtimeStrategy: "production" | "development";

  /**
   * Get framework version
   */
  public static get version() {
    return getFrameworkVersion();
  }

  /**
   * Set the runtime strategy
   */
  public static setRuntimeStrategy(strategy: "production" | "development") {
    this.runtimeStrategy = strategy;
  }

  /**
   * Get project uptime in milliseconds
   */
  public static get uptime(): number {
    return process.uptime() * 1000;
  }

  /**
   * Get the current environment
   */
  public static get environment(): Environment {
    return environment();
  }

  /**
   * Set the current environment
   */
  public static setEnvironment(env: Environment) {
    setEnvironment(env);
  }

  /**
   * Check if the application is running in production environment
   */
  public static get isProduction(): boolean {
    return this.environment === "production";
  }

  /**
   * Check if the application is running in development environment
   */
  public static get isDevelopment(): boolean {
    return this.environment === "development";
  }

  /**
   * Check if the application is running in test environment
   */
  public static get isTest(): boolean {
    return this.environment === "test";
  }

  /**
   * Get the root path
   */
  public static get rootPath(): string {
    return rootPath();
  }

  /**
   * Get the src path
   */
  public static get srcPath(): string {
    return srcPath();
  }

  /**
   * Get the app path
   */
  public static get appPath(): string {
    return appPath();
  }

  /**
   * Get the storage path
   */
  public static get storagePath(): string {
    return storagePath();
  }

  /**
   * Get the uploads path
   */
  public static get uploadsPath(): string {
    return uploadsPath();
  }

  /**
   * Get the public path
   */
  public static get publicPath(): string {
    return publicPath();
  }
}
