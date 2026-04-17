import { colors } from "@mongez/copper";
import {
  type DataSource,
  type DriverContract,
  DatabaseWriterValidationError,
  dataSourceRegistry,
  migrationRunner,
  transaction,
} from "@warlock.js/cascade";
import { Seeder } from "./seeder";
import { SeedsTableMigration } from "./seeds-table-migration";
import { SeederMetadata, SeedResult } from "./types";
import { seedsTableName } from "./utils";

export type SeedersManagerOptions = {
  datasource?: DataSource;
};

export class SeedersManager {
  public seeders: Seeder[] = [];

  protected datasource?: DataSource;

  public constructor(protected options?: SeedersManagerOptions) {
    this.datasource = options?.datasource ?? dataSourceRegistry.get();
  }

  /**
   * Register new seeder
   */
  public register(...seeders: Seeder[]) {
    this.seeders.push(...seeders);
    return this;
  }

  /**
   * Initialize before running
   */
  protected async init() {
    if (!(await this.driver.blueprint.tableExists(seedsTableName))) {
      await migrationRunner.run(SeedsTableMigration);
    }
  }

  /**
   * Run seeders
   */
  public async run(withTransaction = true) {
    await this.init();

    this.prepareSeeders();

    console.log(`🌱 Running ${this.seeders.length} seeder(s)...\n`);

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const seeder of this.seeders) {
      // Check if already executed
      if (seeder.once && (await this.seederIsExecutedBefore(seeder))) {
        console.log(`⏭️  Skipping ${colors.yellow(seeder.name)} (already executed)`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`🔄 Running ${colors.green(seeder.name)}...`);
        const startTime = Date.now();

        const result = withTransaction
          ? await transaction(async () => seeder.run())
          : await seeder.run();

        const duration = Date.now() - startTime;
        if (result) {
          await this.storeSeedsResults(seeder, result);
        }

        console.log(
          `✅ ${colors.green(seeder.name)} completed (${duration}ms, ${result?.recordsCreated ?? 0} records)\n`,
        );
        successCount++;
      } catch (error: any) {
        const err = error as Error;
        console.error(`❌ ${colors.red(seeder.name)} failed:`, err.message);
        console.log(err);
        failedCount++;

        if (error instanceof DatabaseWriterValidationError) {
          console.log(error.errors);
        }

        // Re-throw to stop execution (or continue to next seed based on your preference)
        throw error;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log(`✅ Success: ${successCount}`);

    if (skippedCount > 0) console.log(`⏭️  Skipped: ${skippedCount}`);

    if (failedCount > 0) console.log(`❌ Failed: ${failedCount}`);

    console.log("=".repeat(50));
  }

  /**
   * Sort seeds
   */
  public sort() {
    this.seeders = this.seeders.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    return this;
  }

  /**
   * Prepare seeders to order by the seeder order
   * Also keep an eye on the dependsOn for each seeder to make sure
   * they are ordered correctly
   */
  public prepareSeeders() {
    this.seeders = this.seeders.filter((seeder) => seeder.enabled !== false);

    this.sort();

    // TODO: Handle dependsOn resolution
    // This is more complex - needs topological sort
  }

  /**
   * Store seed results in db
   */
  public async storeSeedsResults(seeder: Seeder, result: SeedResult) {
    const oldResult = await this.getMetadata(seeder);

    // log with an emoji icon at beginning of text no of total craeted records
    console.log(`📊 Total records created: ${result.recordsCreated}`);

    if (oldResult) {
      // Update existing record - use query builder with WHERE clause
      await this.driver
        .queryBuilder(seedsTableName)
        .where("name", seeder.name)
        .update({
          runCount: oldResult.runCount + 1,
          lastRunAt: new Date(),
          totalRecordsCreated: oldResult.totalRecordsCreated + result.recordsCreated,
          lastRunRecordsCreated: result.recordsCreated,
        });

      // now display total created records so far
      console.log(
        `📊 Total records created so far: ${oldResult.totalRecordsCreated + result.recordsCreated}`,
      );
    } else {
      // Insert new record
      await this.driver.insert(seedsTableName, {
        name: seeder.name,
        createdAt: new Date(),
        firstRunAt: new Date(),
        lastRunAt: new Date(),
        runCount: 1,
        totalRecordsCreated: result.recordsCreated,
        lastRunRecordsCreated: result.recordsCreated,
      });
    }
  }

  /**
   * Get seed info from database
   */
  protected getMetadata(seeder: Seeder): Promise<SeederMetadata> {
    const driver = this.datasource.driver;

    return driver.queryBuilder(seedsTableName).where("name", seeder.name).first();
  }

  /**
   * Get driver instance
   */
  protected get driver(): DriverContract {
    return this.datasource.driver;
  }

  /**
   * Check if seeder has been executed before
   */
  protected async seederIsExecutedBefore(seeder: Seeder) {
    return !!(await this.getMetadata(seeder));
  }
}
