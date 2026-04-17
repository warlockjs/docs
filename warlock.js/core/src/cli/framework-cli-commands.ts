import { addCommand } from "./commands/add.command";
import { buildCommand } from "./commands/build.command";
import { createDatabaseCommand } from "./commands/create-database.command";
import { devServerCommand } from "./commands/dev-server.command";
import { dropTablesCommand } from "./commands/drop-tables.command";
import {
  generateCommand,
  generateControllerCommand,
  generateMigrationCommand,
  generateModelCommand,
  generateModuleCommand,
  generateRepositoryCommand,
  generateResourceCommand,
  generateServiceCommand,
  generateValidationCommand,
} from "./commands/generate/generate.command";
import { migrateCommand } from "./commands/migrate.command";
import { seedCommand } from "./commands/seed.command";
import { startProductionCommand } from "./commands/start-production.command";
import { storagePutCommand } from "./commands/storage-put.command";
import { typingsGeneratorCommand } from "./commands/typings-generator.command";

export const frameworkCommands = [
  // development commands
  devServerCommand,
  typingsGeneratorCommand,

  // production commands
  buildCommand,
  startProductionCommand,

  // database commands
  migrateCommand,
  seedCommand,
  createDatabaseCommand,
  dropTablesCommand,

  // generation/installation commands
  addCommand,

  // scaffolding commands
  generateCommand,
  generateModuleCommand,
  generateControllerCommand,
  generateServiceCommand,
  generateModelCommand,
  generateRepositoryCommand,
  generateResourceCommand,
  generateValidationCommand,
  generateMigrationCommand,

  // storage commands
  storagePutCommand,
];
