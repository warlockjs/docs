import { colors } from "@mongez/copper";
import { command } from "../../cli-command";
import type { CommandActionData } from "../../types";
import { generateController } from "./generators/controller.generator";
import { generateMigration } from "./generators/migration.generator";
import { generateModel } from "./generators/model.generator";
import { generateModule } from "./generators/module.generator";
import { generateRepository } from "./generators/repository.generator";
import { generateResource } from "./generators/resource.generator";
import { generateService } from "./generators/service.generator";
import { generateValidation } from "./generators/validation.generator";

const generators: Record<string, (data: CommandActionData) => Promise<void>> = {
  module: generateModule,
  controller: generateController,
  service: generateService,
  model: generateModel,
  migration: generateMigration,
  repository: generateRepository,
  resource: generateResource,
  validation: generateValidation,
};

async function generateCommandAction(data: CommandActionData) {
  const commandName = data.args[0];

  if (!commandName) {
    console.log(colors.red("Error: Generator name is required"));
    console.log(colors.yellow("\nAvailable generators:"));
    Object.keys(generators).forEach((cmd) => {
      console.log(colors.cyan(`  - ${cmd}`));
    });
    console.log(colors.yellow("\nUsage: warlock generate <generator> <name> [options]"));
    process.exit(1);
  }

  const generator = generators[commandName];

  if (!generator) {
    console.log(colors.red(`Error: Unknown generator "${commandName}"`));
    console.log(colors.yellow("\nAvailable generators:"));
    Object.keys(generators).forEach((cmd) => {
      console.log(colors.cyan(`  - ${cmd}`));
    });
    process.exit(1);
  }

  // Remove the command name from args for the generator
  const generatorData: CommandActionData = {
    ...data,
    args: data.args.slice(1),
  };

  await generator(generatorData);
}

// Master generate command
export const generateCommand = command({
  name: "generate <generator> [args...]",
  alias: "g", // Allows 'warlock g module ...'
  description: "Scaffold a new component",
  action: generateCommandAction,
  options: [
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
  ],
});

// Individual commands
export const generateModuleCommand = command({
  name: "generate.module <name>",
  alias: "gen.m",
  description: "Generate a new module",
  action: generateModule,
  options: [
    {
      text: "--crud, -c",
      description: "Generate full CRUD scaffold (controllers, model, validation, routes)",
      defaultValue: true,
    },
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
  ],
});

export const generateControllerCommand = command({
  name: "generate.controller <module>/<name>",
  alias: "gen.c",
  description: "Generate a new controller",
  action: generateController,
  options: [
    {
      text: "--with-validation, -v",
      description: "Generate validation schema and request type",
    },
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
  ],
});

export const generateServiceCommand = command({
  name: "generate.service <module>/<name>",
  alias: "gen.s",
  description: "Generate a new service",
  action: generateService,
  options: [
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
  ],
});

export const generateModelCommand = command({
  name: "generate.model <module>/<name>",
  alias: "gen.md",
  description: "Generate a new model with migration",
  action: generateModel,
  options: [
    {
      text: "--with-resource, -rs",
      description: "Generate resource",
    },
    {
      text: "--table <name>",
      description: "Specify table name",
    },
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
    {
      text: "--timestamps [bool]",
      description: "Include timestamps in migration (default: true)",
    },
  ],
});

export const generateRepositoryCommand = command({
  name: "generate.repository <module>/<name>",
  alias: "gen.r",
  description: "Generate a new repository",
  action: generateRepository,
  options: [
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
  ],
});

export const generateResourceCommand = command({
  name: "generate.resource <module>/<name>",
  alias: "gen.rs",
  description: "Generate a new resource",
  action: generateResource,
  options: [
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
  ],
});

export const generateValidationCommand = command({
  name: "generate.validation <module>/<name>",
  alias: "gen.v",
  description: "Generate a new validation schema",
  action: generateValidation,
  options: [
    {
      text: "--with-request, -r",
      description: "Generate request type",
    },
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
  ],
});

export const generateMigrationCommand = command({
  name: "generate.migration <model-path>",
  alias: "gen.mig",
  description: "Generate a new migration for a model",
  action: generateMigration,
  options: [
    {
      text: "--force, -f",
      description: "Overwrite existing files",
    },
    {
      text: "--add <columns>",
      description: "Columns to add (DSL: name:type:modifier,...)",
    },
    {
      text: "--drop <columns>",
      description: "Columns to drop (comma-separated names)",
    },
    {
      text: "--rename <columns>",
      description: "Columns to rename (DSL: old:new,...)",
    },
    {
      text: "--timestamps [bool]",
      description: "Include timestamps (default: true)",
    },
  ],
});
