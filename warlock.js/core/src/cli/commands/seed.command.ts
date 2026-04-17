import { seedCommandAction } from "../../database/seed-command-action";
import { command } from "../cli-command";

export const seedCommand = command({
  action: seedCommandAction,
  name: "seed",
  description: "Run database seeds",
  preload: {
    config: true,
    env: true,
    bootstrap: true,
    connectors: ["database", "cache", "logger"],
  },
  options: [
    {
      text: "--fresh, -f",
      description: "Drop all tables records and run seeds",
      type: "boolean",
    },
    {
      text: "--order, -o",
      description: "Display the seeds list in order without execution",
      type: "boolean",
    },
    {
      text: "--transaction, -t",
      description: "Run seeds in a transaction",
      type: "boolean",
      defaultValue: true,
    },
  ],
});
