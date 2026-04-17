import { colors } from "@mongez/copper";
import { log } from "@warlock.js/logger";
import fs from "fs";
import path from "path";
import type { MigrationDriverContract } from "../contracts/migration-driver.contract";
import type { DataSource } from "../data-source/data-source";
import { dataSourceRegistry } from "../data-source/data-source-registry";
import { type Migration } from "./migration";
import { SQLGrammar } from "./sql-grammar";
import type { MigrationRecord, MigrationResult, TaggedSQL } from "./types";

/**
 * Migration class type with static name property.
 */
type MigrationClass = (new () => Migration) & {
  migrationName: string;
  createdAt?: string;
};

/**
 * Resolved instance data for a single pending migration.
 * @internal
 */
type MigrationData = {
  MigrationClass: MigrationClass;
  migration: Migration;
  name: string;
};

/**
 * Options for migration execution.
 */
type ExecuteOptions = {
  /** Run in dry-run mode (no actual changes) */
  readonly dryRun?: boolean;
  /** Record to migrations table (default: true for batch, false for single) */
  readonly record?: boolean;
};

/**
 * Parse createdAt timestamp from custom format to Date.
 * Supports both: MM-DD-YYYY_HH-MM-SS and DD-MM-YYYY_HH-MM-SS
 * Intelligently detects format by checking if first value > 12 (must be day)
 * Falls back to standard Date parsing for ISO strings.
 */
function parseCreatedAt(createdAt: string): Date | undefined {
  const match = createdAt.match(/^(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, first, second, year, hour, minute, second_time] = match;
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);

    let month: number, day: number;

    // Intelligently detect format:
    // If first > 12, it must be DD-MM-YYYY (day can't be month)
    // If second > 12, it must be MM-DD-YYYY (day can't be month)
    // Otherwise, assume MM-DD-YYYY (US format as default)
    if (firstNum > 12) {
      // DD-MM-YYYY format
      day = firstNum;
      month = secondNum;
    } else if (secondNum > 12) {
      // MM-DD-YYYY format
      month = firstNum;
      day = secondNum;
    } else {
      // Ambiguous - default to MM-DD-YYYY
      month = firstNum;
      day = secondNum;
    }

    const date = new Date(
      parseInt(year),
      month - 1, // JavaScript months are 0-indexed
      day,
      parseInt(hour),
      parseInt(minute),
      parseInt(second_time),
    );

    // Validate the date is actually valid
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }
  // Fallback to standard Date parsing for ISO strings
  try {
    const date = new Date(createdAt);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

/**
 * Comparator for sorting migration classes.
 *
 * Priority:
 *   1. `createdAt` timestamp (older = earlier)
 *   2. Alphabetical by migration name (last resort)
 */
function sortMigrations(
  a: { createdAt?: string; migrationName: string },
  b: { createdAt?: string; migrationName: string },
): number {
  // Sort by createdAt timestamp
  const aDate = a.createdAt ? parseCreatedAt(a.createdAt) : undefined;
  const bDate = b.createdAt ? parseCreatedAt(b.createdAt) : undefined;

  if (aDate && bDate) return aDate.getTime() - bDate.getTime();
  if (aDate) return -1;
  if (bDate) return 1;

  // Last resort: alphabetical
  return a.migrationName.localeCompare(b.migrationName);
}

/**
 * Migration runner that executes migrations.
 *
 * This is a pure executor - it doesn't discover migrations.
 * Discovery is handled by the framework (e.g., @warlock.js/core CLI).
 *
 * The migration name is read from the static `name` property on the class,
 * which should be set by the CLI after importing:
 *
 * @example
 * ```typescript
 * // In CLI after importing:
 * const { default: MigrationClass } = await import("./create-users.migration.ts");
 * MigrationClass.migrationName ??= "create-users";
 *
 * // Then register or execute:
 * runner.register(MigrationClass);
 * // or
 * await runner.execute(MigrationClass);
 * ```
 *
 * @example
 * ```typescript
 * // Simple direct execution
 * await runner.execute(CreateUsersTable);
 * await runner.rollback(CreateUsersTable);
 *
 * // Registry pattern for batch operations
 * runner.register(CreateUsersTable);
 * runner.register(AddEmailIndex);
 * await runner.runAll();
 * await runner.rollbackAll();
 * ```
 */
export class MigrationRunner {
  /** Registered migrations */
  public readonly migrations: MigrationClass[] = [];

  /** Data source to use */
  private dataSource?: DataSource;

  /** Cached migration driver */
  private cachedMigrationDriver?: MigrationDriverContract;

  /** Table name for tracking migrations */
  private readonly migrationsTable: string;

  /** Whether to log operations */
  private readonly verbose: boolean;

  /**
   * Create a new migration runner.
   *
   * @param options - Runner options
   */
  public constructor(
    options: {
      dataSource?: DataSource;
      migrationsTable?: string;
      verbose?: boolean;
    } = {},
  ) {
    this.dataSource = options.dataSource;
    this.migrationsTable = options.migrationsTable ?? "_migrations";
    this.verbose = options.verbose ?? true;
  }

  // ============================================================================
  // DATA SOURCE
  // ============================================================================

  /**
   * Set the data source.
   */
  public setDataSource(dataSource: DataSource): this {
    this.dataSource = dataSource;
    this.cachedMigrationDriver = undefined;
    return this;
  }

  /**
   * Get the data source.
   */
  private getDataSource(): DataSource {
    if (!this.dataSource) {
      this.dataSource = dataSourceRegistry.get();
    }
    return this.dataSource;
  }

  /**
   * Get the migration driver.
   */
  private getMigrationDriver(): MigrationDriverContract {
    if (!this.cachedMigrationDriver) {
      this.cachedMigrationDriver = this.getDataSource().driver.migrationDriver();
    }
    return this.cachedMigrationDriver;
  }

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  /**
   * Register a migration.
   *
   * The migration name is read from `MigrationClass.migrationName`.
   *
   * @param MigrationClass - Migration class (must have static `name` set)
   * @param createdAt - Optional timestamp for ordering
   * @returns This runner for chaining
   *
   * @example
   * ```typescript
   * CreateUsersTable.migrationName = "2024-01-15_create-users";
   * runner.register(CreateUsersTable);
   * ```
   */
  public register(MigrationClass: MigrationClass): this {
    const name = MigrationClass.migrationName;
    if (!name) {
      throw new Error(
        `Migration class must have a static 'migrationName' property set. ` +
          `Set it in CLI after importing: MigrationClass.migrationName = "filename";`,
      );
    }
    // Avoid duplicates
    if (!this.migrations.some((m) => m.migrationName === name)) {
      this.migrations.push(MigrationClass);
    }

    return this;
  }

  /**
   * Register multiple migrations.
   *
   * @param migrations - Array of migration classes
   * @returns This runner for chaining
   */
  public registerMany(migrations: MigrationClass[]): this {
    for (const MigrationClass of migrations) {
      this.register(MigrationClass);
    }
    return this;
  }

  /**
   * Clear all registered migrations.
   */
  public clear(): this {
    this.migrations.length = 0;
    return this;
  }

  /**
   * Get all registered migration names.
   */
  public getRegisteredNames(): string[] {
    return this.migrations.map((m) => m.migrationName);
  }

  // ============================================================================
  // SINGLE EXECUTION
  // ============================================================================

  /**
   * Execute a single migration's up() method.
   *
   * @param MigrationClass - Migration class to execute
   * @param options - Execution options
   * @returns Migration result
   *
   * @example
   * ```typescript
   * await runner.execute(CreateUsersTable);
   * await runner.execute(AddEmailIndex, { dryRun: true });
   * ```
   */
  public async run(
    MigrationClass: MigrationClass,
    options: ExecuteOptions = {},
  ): Promise<MigrationResult> {
    return this.runMigration(MigrationClass, "up", {
      dryRun: options.dryRun,
      record: options.record ?? false,
    });
  }

  /**
   * Execute a single migration's down() method.
   *
   * @param MigrationClass - Migration class to rollback
   * @param options - Execution options
   * @returns Migration result
   *
   * @example
   * ```typescript
   * await runner.rollback(CreateUsersTable);
   * ```
   */
  public async rollback(
    MigrationClass: MigrationClass,
    options: ExecuteOptions = {},
  ): Promise<MigrationResult> {
    return this.runMigration(MigrationClass, "down", {
      dryRun: options.dryRun,
      record: options.record ?? false,
    });
  }

  // ============================================================================
  // BATCH EXECUTION (REGISTERED MIGRATIONS)
  // ============================================================================

  /**
   * Run all pending registered migrations.
   *
   * Only runs migrations not already in the migrations table.
   *
   * @param options - Execution options
   * @returns Results for each migration
   *
   * @example
   * ```typescript
   * runner.register(CreateUsersTable);
   * runner.register(AddEmailIndex);
   * const results = await runner.runAll();
   * ```
   */
  public async runAll(options: ExecuteOptions = {}): Promise<MigrationResult[]> {
    const { dryRun = false, record = true } = options;

    const results: MigrationResult[] = [];

    // Get pending migrations
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      log.warn("database", "migration", "Nothing to migrate.");
      return results;
    }

    log.info(
      "database",
      "migration",
      `Found ${pending.length} pending migration(s). Generating SQL pool...`,
    );
    const nextBatch = await this.getNextBatchNumber();

    const taggedStatements: TaggedSQL[] = [];
    const migrationsData: MigrationData[] = [];

    // 1. Collect SQL from each pending migration.
    //    Fire extension checks concurrently as we encounter CREATE EXTENSION
    //    statements — they resolve before execution begins.
    const extensionChecks: Promise<void>[] = [];

    for (const MigrationClass of pending) {
      const migration = this.createMigrationInstance(MigrationClass);
      const name = MigrationClass.migrationName;

      await migration.up();
      const upStatements = migration.toSQL();

      migrationsData.push({ MigrationClass, migration, name });

      for (const sql of upStatements) {
        const statementType = SQLGrammar.classify(sql);

        if (statementType === "CREATE_EXTENSION") {
          const ext = SQLGrammar.extractExtensionName(sql);
          if (ext) extensionChecks.push(this.informIfExtensionMissing(ext));
        }

        taggedStatements.push({
          sql,
          phase: SQLGrammar.phase(sql),
          statementType,
          createdAt: MigrationClass.createdAt,
          migrationName: name,
        });
      }
    }

    // 2. Resolve all extension checks before any SQL is executed.
    //    Each check displays a rich message if the extension is missing
    //    but does not throw — execution continues and Postgres will
    //    surface its own error with full context already shown.
    await Promise.all(extensionChecks);

    // 3. Sort all SQL statements globally across all pending migrations
    const sortedStatements = SQLGrammar.sort(taggedStatements);

    // 4. Execute in a single batch
    if (dryRun) {
      log.info("database", "migration", "Dry run enabled. Would execute the following statements:");
      for (const statement of sortedStatements) {
        console.log(
          `-- [${statement.statementType}] Phase ${statement.phase} [${statement.migrationName}]`,
        );
        console.log(statement.sql + ";\n");
      }
      return [];
    }

    const driver = this.getDataSource().driver;

    let transactionFailed = false;
    let errorMessage = "";
    /** The migration name that owns the SQL statement that threw. */
    let failingMigrationName: string | undefined;

    const startTime = Date.now();

    /**
     * Execute all sorted statements, capturing which migration owns the
     * statement that throws — so we report a precise culprit instead of
     * blaming every migration in the batch.
     */
    const executeStatements = async (): Promise<void> => {
      for (const statement of sortedStatements) {
        try {
          await driver.query(statement.sql);
        } catch (err) {
          failingMigrationName = statement.migrationName;
          throw err;
        }
      }

      if (record) {
        for (const data of migrationsData) {
          await this.recordMigration(
            data.name,
            nextBatch,
            data.MigrationClass.createdAt
              ? parseCreatedAt(data.MigrationClass.createdAt)
              : new Date(),
          );
        }
      }
    };

    try {
      if (driver.transaction) {
        await driver.transaction(executeStatements);
      } else {
        await executeStatements();
      }
    } catch (err) {
      transactionFailed = true;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const durationMs = Date.now() - startTime;

    // Report results per-migration.
    // Only the migration that owns the failing statement is marked as failed;
    // all others are reported as rolled back / not reached.
    for (const data of migrationsData) {
      const isCulprit = transactionFailed && data.name === failingMigrationName;
      const wasSkipped = transactionFailed && !isCulprit;

      results.push({
        name: data.name,
        table: data.migration.table,
        direction: "up",
        success: !transactionFailed,
        error: isCulprit ? errorMessage : undefined,
        durationMs: Math.round(durationMs / migrationsData.length),
        executedAt: new Date(),
      });

      if (isCulprit) {
        log.error(
          "database",
          "migration",
          `${colors.magenta(data.name)}: ✗ Failed: ${errorMessage}`,
        );
      } else if (wasSkipped) {
        log.warn(
          "database",
          "migration",
          `${colors.magenta(data.name)}: rolled back (batch transaction failed)`,
        );
      } else {
        log.success("database", "migration", `Migrated: ${colors.magenta(data.name)} successfully`);
      }
    }

    if (transactionFailed) {
      log.error(
        "database",
        "migration",
        `Batch execution failed. Rollback performed if transactional.`,
      );
      throw new Error("Migration batch failed: " + errorMessage);
    }

    const successCount = results.filter((r) => r.success).length;
    log.success(
      "database",
      "migration",
      `Migration bulk phase execution complete: ${successCount}/${pending.length} migrations processed successfully.`,
    );

    return results;
  }

  /**
   * Export migrations as phase-ordered SQL files in database/sql/ directory.
   * By default, it exports all registered migrations. Use `pendingOnly: true` to export only pending ones.
   */
  public async exportSQL(options: { pendingOnly?: boolean; compact?: boolean } = {}): Promise<void> {
    const migrationsToExport = options.pendingOnly
      ? await this.getPendingMigrations()
      : this.migrations;

    if (migrationsToExport.length === 0) {
      log.warn("database", "migration", "No migrations to export.");
      return;
    }

    log.info(
      "database",
      "migration",
      `Exporting ${migrationsToExport.length} ${options.pendingOnly ? "pending " : ""}migration(s) to SQL files...`,
    );

    const upStatements: TaggedSQL[] = [];
    const downStatements: TaggedSQL[] = [];

    for (const MigrationClass of migrationsToExport) {
      const migration = this.createMigrationInstance(MigrationClass);
      const name = MigrationClass.migrationName;

      // Collect up SQL
      await migration.up();
      for (const sql of migration.toSQL()) {
        upStatements.push({
          sql,
          phase: SQLGrammar.phase(sql),
          statementType: SQLGrammar.classify(sql),
          createdAt: MigrationClass.createdAt,
          migrationName: name,
        });
      }

      // Collect down SQL (reuse same instance — toSQL() cleared pendingOps)
      await migration.down();
      for (const sql of migration.toSQL()) {
        downStatements.push({
          sql,
          phase: SQLGrammar.phase(sql),
          statementType: SQLGrammar.classify(sql),
          createdAt: MigrationClass.createdAt,
          migrationName: name,
        });
      }
    }

    const sortedUp = SQLGrammar.sort(upStatements);
    // Down SQL: reverse order (undo in reverse dependency order)
    const sortedDown = downStatements.reverse();

    const upSQLString = this.formatSQLForExport(sortedUp, options.compact);
    const downSQLString = this.formatSQLForExport(sortedDown, options.compact);

    const rootPath = process.cwd();
    const sqlDir = path.join(rootPath, "database", "sql");

    if (!fs.existsSync(sqlDir)) {
      fs.mkdirSync(sqlDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/T/, "_").replace(/:/g, "-").split(".")[0];
    const upPath = path.join(sqlDir, `migration_${timestamp}.up.sql`);
    const downPath = path.join(sqlDir, `migration_${timestamp}.down.sql`);

    fs.writeFileSync(upPath, upSQLString);
    fs.writeFileSync(downPath, downSQLString);

    log.success("database", "migration", `Exported to:\n- ${upPath}\n- ${downPath}`);
  }

  /**
   * Rollback the last batch of migrations.
   *
   * @param options - Execution options
   * @returns Results for each migration
   */
  public async rollbackLast(options: ExecuteOptions = {}): Promise<MigrationResult[]> {
    return this.rollbackBatches(1, options);
  }

  /**
   * Rollback N batches of migrations.
   *
   * @param batches - Number of batches to rollback
   * @param options - Execution options
   * @returns Results for each migration
   */
  public async rollbackBatches(
    batches: number,
    options: ExecuteOptions = {},
  ): Promise<MigrationResult[]> {
    const dryRun = options.dryRun ?? false;
    const record = options.record ?? true;
    const results: MigrationResult[] = [];

    const toRollback = await this.getMigrationsToRollback(batches);

    if (toRollback.length === 0) {
      log.warn("database", "migration", "Nothing to rollback.");
      return results;
    }

    log.info("database", "migration", `Rolling back ${toRollback.length} migration(s).`);

    for (const MigrationClass of toRollback) {
      const result = await this.runMigration(MigrationClass, "down", {
        dryRun,
        record,
      });
      results.push(result);

      if (!result.success) {
        break;
      }
    }

    const successCount = results.filter((r) => r.success).length;
    log.success(
      "database",
      "migration",
      `Rollback complete: ${successCount}/${toRollback.length} successful.`,
    );

    return results;
  }

  /**
   * Rollback all executed migrations.
   *
   * @param options - Execution options
   * @returns Results for each migration
   */
  public async rollbackAll(options: ExecuteOptions = {}): Promise<MigrationResult[]> {
    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) {
      log.warn("database", "migration", "Nothing to rollback.");
      return [];
    }

    const maxBatch = Math.max(...executed.map((r) => r.batch));
    return this.rollbackBatches(maxBatch, options);
  }

  /**
   * Reset and re-run: rollback all then run all.
   *
   * @param options - Execution options
   * @returns Combined results
   */
  public async fresh(options: ExecuteOptions = {}): Promise<MigrationResult[]> {
    const rollbackResults = await this.rollbackAll(options);
    const runResults = await this.runAll(options);
    return [...rollbackResults, ...runResults];
  }

  // ============================================================================
  // STATUS
  // ============================================================================

  /**
   * Get status of all registered migrations.
   */
  public async status(): Promise<
    Array<{
      name: string;
      table: string;
      executed: boolean;
      batch: number | null;
    }>
  > {
    const executed = await this.getExecutedMigrations();
    const executedMap = new Map(executed.map((r) => [r.name, r]));

    return this.migrations.map((MigrationClass) => {
      const instance = new MigrationClass();
      const name = MigrationClass.migrationName;
      const record = executedMap.get(name);
      return {
        name,
        table: instance.table,
        executed: !!record,
        batch: record?.batch ?? null,
      };
    });
  }

  // ============================================================================
  // EXTENSION PRE-FLIGHT
  // ============================================================================

  /**
   * Check whether a database extension is available and inform the developer
   * if it is not installed.
   *
   * Does NOT throw — execution proceeds normally. If the extension is truly
   * missing, the database will surface its own error with full context already
   * displayed to the developer.
   *
   * @example
   * await this.informIfExtensionMissing("vector");
   */
  private async informIfExtensionMissing(extension: string): Promise<void> {
    try {
      const migrationDriver = this.getMigrationDriver();
      const isAvailable = await migrationDriver.isExtensionAvailable(extension);

      if (!isAvailable) {
        const hr = "─".repeat(60);
        console.log(`\n${colors.yellow(hr)}`);
        console.log(colors.yellow(`  ⚠  Missing Database Extension: ${colors.bold(extension)}`));
        console.log(colors.yellow(hr));
        console.log();
        console.log(`  A pending migration requires the ${colors.cyan(extension)} extension,`);
        console.log(`  which is not installed on your database server.`);
        console.log();
        console.log(
          `  ${colors.bold("This means the physical database server is missing the extension package.")}`,
        );
        console.log(`  You cannot simply run CREATE EXTENSION until the package is installed`);
        console.log(`  on the host machine or Docker container.`);
        console.log();

        const docsUrl = migrationDriver.getExtensionDocsUrl(extension);
        if (docsUrl) {
          console.log(`  ${colors.bold("Or follow the installation guide:")}`);
          console.log(`    ${colors.cyan(docsUrl)}`);
        }
        console.log(`\n${colors.yellow(hr)}\n`);
      }
    } catch {
      // If the check itself fails, silently skip — don't break the migration.
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Run a single migration.
   */
  private async runMigration(
    MigrationClass: MigrationClass,
    direction: "up" | "down",
    options: {
      dryRun?: boolean;
      record?: boolean;
      batch?: number;
    } = {},
  ): Promise<MigrationResult> {
    const { dryRun = false, record = true } = options;
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    const migration = new MigrationClass();
    const name = MigrationClass.migrationName;

    log.info(
      "database",
      "migration",
      `${direction === "up" ? "Migrating" : "Rolling back"}: ${colors.magenta(name)}...`,
    );

    try {
      if (!dryRun) {
        const driver = this.getMigrationDriver();
        migration.setDriver(driver);
        migration.setMigrationDefaults(this.getDataSource().migrationDefaults);

        // ============================================================================
        // TRANSACTION RESOLUTION (3-tier hierarchy)
        // ============================================================================
        // 1. Migration-level explicit override
        // 2. Config-level global override
        // 3. Driver default (PostgreSQL: true, MongoDB: false)
        const shouldUseTransaction =
          migration.transactional ??
          this.getDataSource().migrations?.transactional ??
          driver.getDefaultTransactional();

        // ============================================================================
        // EXECUTE WITH OR WITHOUT TRANSACTION
        // ============================================================================

        // Collect SQL for the requested direction
        if (direction === "up") {
          await migration.up();
        } else {
          await migration.down();
        }
        const sqlStatements = migration.toSQL();

        const databaseDriver = this.getDataSource().driver;

        if (shouldUseTransaction && databaseDriver.transaction) {
          // Transactional execution
          await databaseDriver.transaction(async () => {
            // Execute generated SQL statements sequentially (no phase-sorting here since it's single execution)
            for (const sql of sqlStatements) {
              await databaseDriver.query(sql);
            }

            // Record migration tracking
            if (record) {
              if (direction === "up") {
                const batch = options.batch ?? (await this.getNextBatchNumber());
                await this.recordMigration(
                  name,
                  batch,
                  MigrationClass.createdAt ? parseCreatedAt(MigrationClass.createdAt) : new Date(),
                );
              } else {
                await this.removeMigrationRecord(name);
              }
            }
          });
        } else {
          // Non-transactional execution
          for (const sql of sqlStatements) {
            await databaseDriver.query(sql);
          }

          if (record) {
            if (direction === "up") {
              const batch = options.batch ?? (await this.getNextBatchNumber());
              await this.recordMigration(
                name,
                batch,
                MigrationClass.createdAt ? parseCreatedAt(MigrationClass.createdAt) : new Date(),
              );
            } else {
              await this.removeMigrationRecord(name);
            }
          }
        }
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      log.error("database", "migration", `${colors.magenta(name)}: ✗ Failed: ${error}`);
      throw err;
    }

    const durationMs = Date.now() - startTime;

    if (success) {
      log.success(
        "database",
        "migration",
        `${direction == "up" ? "Migrated" : "Rolled back"}: ${colors.magenta(name)} successfully (${durationMs}ms)`,
      );
    }

    return {
      name,
      table: migration.table,
      direction,
      success,
      error,
      durationMs,
      executedAt: new Date(),
    };
  }

  /**
   * Create, configure, and return a ready-to-use migration instance.
   *
   * Centralises the repeated "new + setDriver + setMigrationDefaults" boilerplate
   * that all batch/single execution paths need.
   *
   * @internal
   */
  private createMigrationInstance(MigrationClass: MigrationClass): Migration {
    const migration = new MigrationClass();
    migration.setDriver(this.getMigrationDriver());
    migration.setMigrationDefaults(this.getDataSource().migrationDefaults);
    return migration;
  }

  /**
   * Format an ordered array of TaggedSQL into a human-readable SQL file string.
   *
   * Consecutive statements that belong to the same (phase, migration) group share
   * a single block comment at the top, avoiding the noisy per-statement repetition.
   *
   * Example output:
   * ```sql
   * /* Phase 3 [create-users] *\/
   * ALTER TABLE "users" ADD COLUMN "name" TEXT NOT NULL;
   * ALTER TABLE "users" ADD COLUMN "email" TEXT NOT NULL;
   *
   * /* Phase 4 [create-users] *\/
   * CREATE UNIQUE INDEX ...;
   * ```
   *
   * @internal
   */
  private formatSQLForExport(statements: TaggedSQL[], compact: boolean = false): string {
    const lines: string[] = [];

    if (compact) {
      // Just output raw statements, no grouping, no blank lines
      for (const stmt of statements) {
        lines.push(`${stmt.sql};`);
      }
      return lines.join("\n");
    }

    // Group statements by their phase and migration name
    const grouped = new Map<string, string[]>();

    for (const stmt of statements) {
      const groupKey = `Phase ${stmt.phase} [${stmt.migrationName}]`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(stmt.sql);
    }

    // Format each group
    for (const [groupKey, sqls] of grouped.entries()) {
      if (lines.length > 0) lines.push(""); // blank line between groups
      lines.push(`/* ${groupKey} */`);
      for (const sql of sqls) {
        lines.push(`${sql};`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Get pending (not executed) registered migrations.
   */
  private async getPendingMigrations(): Promise<MigrationClass[]> {
    const executed = await this.getExecutedMigrations();
    const executedNames = new Set(executed.map((r) => r.name));
    const migrations = this.migrations.filter((m) => !executedNames.has(m.migrationName));

    return migrations.sort(sortMigrations);
  }

  /**
   * Get migrations to rollback.
   */
  private async getMigrationsToRollback(batches: number): Promise<MigrationClass[]> {
    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) return [];

    const batchNumbers = [...new Set(executed.map((r) => r.batch))]
      .sort((a, b) => b - a)
      .slice(0, batches);

    const toRollback = executed.filter((r) => batchNumbers.includes(r.batch)).reverse();

    const migrations = toRollback
      .map((r) => this.migrations.find((m) => m.migrationName === r.name))
      .filter((m): m is MigrationClass => !!m);

    return migrations.sort(sortMigrations);
  }

  /**
   * Get executed migration records.
   */
  public async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const driver = this.getDataSource().driver;

    try {
      const migrationDriver = this.getMigrationDriver();

      // Ensure migrations table exists
      await migrationDriver.ensureMigrationsTable(this.migrationsTable);

      const queryBuilder = driver.queryBuilder<MigrationRecord>(this.migrationsTable);
      return await queryBuilder.orderBy("batch", "asc").orderBy("name", "asc").get();
    } catch {
      return [];
    }
  }

  /**
   * Record a migration.
   */
  private async recordMigration(name: string, batch: number, createdAt?: Date): Promise<void> {
    const driver = this.getDataSource().driver;
    const migrationDriver = this.getMigrationDriver();

    // Ensure migrations table exists
    await migrationDriver.ensureMigrationsTable(this.migrationsTable);

    await driver.insert(this.migrationsTable, {
      name,
      batch,
      executedAt: new Date(),
      createdAt,
    });
  }

  /**
   * Remove a migration record.
   */
  private async removeMigrationRecord(name: string): Promise<void> {
    const driver = this.getDataSource().driver;
    await driver.delete(this.migrationsTable, { name });
  }

  /**
   * Get next batch number.
   */
  private async getNextBatchNumber(): Promise<number> {
    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) return 1;
    return Math.max(...executed.map((r) => r.batch)) + 1;
  }
}

export const migrationRunner = new MigrationRunner();
