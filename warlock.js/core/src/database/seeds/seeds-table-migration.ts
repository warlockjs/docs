import { Migration } from "@warlock.js/cascade";
import { seedsTableName } from "./utils";

export class SeedsTableMigration extends Migration {
  public static migrationName = "seeds-table-migration";
  public table = seedsTableName;

  public up() {
    this.createTableIfNotExists();

    this.id();
    this.text("name").unique();
    this.int("runCount").default(0);
    this.dateTime("createdAt").useCurrent();
    this.dateTime("firstRunAt").useCurrent();
    this.dateTime("lastRunAt").useCurrent();
    this.int("totalRecordsCreated").default(0);
    this.int("lastRunRecordsCreated").default(0);
  }

  public down() {
    this.dropTableIfExists(seedsTableName);
  }
}
