import { colors } from "@mongez/copper";
import dayjs from "dayjs";
import { onceConnected } from "../utils";
import { migrationOffice } from "./migration-office";
import { migrationOfficer } from "./migration-officer";

/**
 * List all created migrations
 */
export function listMigrations() {
  onceConnected(async () => {
    console.log(
      colors.blue("→"),
      colors.cyan("[migration]"),
      colors.yellow('"Listing all migrations"'),
    );

    // get migrations from database
    const migrations = await migrationOfficer.list();

    if (!migrations.length) {
      console.log(
        // exclamation mark
        colors.yellow("⚠"),
        colors.cyan("[migration]"),
        "No migrations found",
      );

      return;
    }

    for (const migration of migrations) {
      console.log(
        // add green check mark
        colors.green("✓"),
        colors.cyan("[migration]"),
        colors.magentaBright(
          dayjs(migration.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        ),
        colors.greenBright(migration.name),
      );
    }
  });
}

/**
 * Drop all migrations
 */
export async function dropMigrations() {
  for (const migration of migrationOffice.list()) {
    const migrationName = migration.name;

    console.log(
      colors.blue("→"),
      colors.cyan("[migration]"),
      colors.gray("[dropping]"),
      colors.red("Dropping"),
      colors.yellowBright(`${migrationName} migration`),
    );
    try {
      await migration.executeDown();

      await migrationOfficer.dropMigration(migrationName);

      console.log(
        colors.green("✓"),
        colors.cyan("[migration]"),
        colors.gray("[dropped]"),
        colors.redBright("Dropped"),
        colors.greenBright(`${migrationName} migration`),
      );
    } catch (error: any) {
      console.log(
        colors.red("✗"),
        colors.cyan("[migration]"),
        colors.gray("[dropFailed]"),
        colors.redBright("Failed to drop"),
        colors.greenBright(`${migrationName} migration`),
      );

      console.log(error.message);
    }
  }
}

/**
 * Run migrations
 */
export async function migrate(fresh = false) {
  if (fresh) {
    await dropMigrations();
  }

  const migrations = migrationOffice.list();

  for (const migration of migrations) {
    const migrationName = migration.name;
    const index = migrations.indexOf(migration);

    console.log(
      // add blue arrow mark
      colors.blue("→"),
      colors.cyan("[migration] " + (index + 1) + "/" + migrations.length),
      colors.magenta("[migrating]"),
      "Creating " + colors.yellowBright(`${migrationName} migration`),
    );

    try {
      const isMigrated = await migrationOfficer.isMigrated(migrationName);

      if (isMigrated) {
        console.log(
          // add red x mark
          colors.red("✗"),
          colors.cyan("[migration]"),
          colors.gray("[skipped]"),
          `${colors.redBright(
            migrationName + " Migration",
          )} has been done before.`,
        );
        continue;
      }

      await migration.executeUp();

      await migrationOfficer.migrate(migrationName);
      console.log(
        // add green check mark
        colors.green("✓"),
        colors.cyan("[migration]"),
        colors.magentaBright("[migrated]"),
        `${colors.greenBright(
          migrationName + " Migration",
        )} has been migrated successfully.`,
      );
    } catch (error) {
      console.log(error);
    }
  }
}
