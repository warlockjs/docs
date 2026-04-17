import { colors } from "@mongez/copper";
import { Environment } from "../utils";
import { getWarlockVersion } from "../utils/framework-vesion";

export function isMatchingCommandName(commandName: string, targetingCommandName: string) {
  return commandName.split(" ")[0] === targetingCommandName;
}

/**
 * Display the Warlock.js version banner
 */
export async function displayWarlockVersionInTerminal() {
  const version = await getWarlockVersion();
  console.log(`⚡ ${colors.bold("Warlock.js")} ${colors.greenBright(`v${version}`)}`);
}

type StartBannerOptions = {
  environment: Environment;
};

function getTextColorMethod(environment: Environment) {
  switch (environment) {
    case "development":
      return colors.yellowBright;
    case "production":
      return colors.greenBright;
    case "test":
      return colors.blueBright;
    default:
      return colors.whiteBright;
  }
}

/**
 * Display CLI startup banner
 */
export async function displayStartupBanner({ environment }: StartBannerOptions) {
  const version = await getWarlockVersion();
  const textColorMethod = getTextColorMethod(environment);
  console.log(`  ⚡ ${colors.bold(textColorMethod("Warlock.js"))} ${colors.dim(`v${version}`)}`);
  console.log();
}

/**
 * Display command execution header
 */
export function displayExecutingCommand(commandName: string) {
  console.log(`  ${colors.cyan("›")} Running ${colors.bold(colors.white(commandName))}...`);
  console.log();
}

/**
 * Display command not found error with optional suggestions
 */
export function displayCommandNotFound(commandName: string, suggestions?: string[]) {
  console.log();
  console.log(`  ${colors.red("✖")} Command ${colors.magenta(commandName)} not found`);

  if (suggestions && suggestions.length > 0) {
    console.log();
    console.log(`  ${colors.yellow("Did you mean?")}`);
    suggestions.forEach((suggestion) => {
      console.log(`    ${colors.cyan("→")} ${colors.white(suggestion)}`);
    });
  }

  console.log();
  console.log(
    `  ${colors.dim("Run")} ${colors.cyan("warlock --help")} ${colors.dim("to see available commands")}`,
  );
  console.log();
}

/**
 * Display missing command error
 */
export function displayMissingCommand() {
  console.log();
  console.log(`  ${colors.red("✖")} No command specified`);
  console.log(
    `  ${colors.dim("Run")} ${colors.cyan("warlock --help")} ${colors.dim("to see available commands")}`,
  );
  console.log();
}

/**
 * Display command success message
 */
export function displayCommandSuccess(commandName: string, durationMs?: number) {
  const duration = durationMs ? colors.dim(` (${durationMs}ms)`) : "";
  console.log();
  console.log(
    `  ${colors.green("✔")} ${colors.bold(commandName)} completed successfully${duration}`,
  );
  console.log();
}

/**
 * Display command error message
 */
export function displayCommandError(commandName: string, error: Error) {
  console.log();
  console.log(`  ${colors.red("✖")} ${colors.bold(commandName)} failed`);
  console.log(`  ${colors.dim(error.message)}`);
  console.log();
}

/**
 * Display missing required options error
 */
export function displayMissingOptions(options: { name: string; text: string }[]) {
  console.log();
  console.log(`  ${colors.red("✖")} Missing required options:`);
  options.forEach((opt) => {
    console.log(`     ${colors.yellow(opt.text)} ${colors.dim(`(--${opt.name})`)}`);
  });
  console.log();
}

/**
 * Command info for help display
 */
export type HelpCommandInfo = {
  name: string;
  alias?: string;
  description?: string;
  source: "framework" | "plugin" | "project";
};

/**
 * Display global help with all commands grouped by source
 */
export async function displayHelp(commands: HelpCommandInfo[]) {
  const version = await getWarlockVersion();

  console.log();
  console.log(
    `  ⚡ ${colors.bold(colors.yellowBright("Warlock.js"))} CLI ${colors.dim(`v${version}`)}`,
  );
  console.log();
  console.log(
    `  ${colors.bold("Usage:")} ${colors.cyan("warlock")} ${colors.dim("<command>")} ${colors.dim("[options]")}`,
  );
  console.log();

  // Group by source
  const grouped: Record<string, HelpCommandInfo[]> = {
    framework: [],
    plugin: [],
    project: [],
  };

  commands.forEach((cmd) => {
    grouped[cmd.source]?.push(cmd);
  });

  // Display each group
  const groupLabels: Record<string, string> = {
    framework: "Framework Commands",
    plugin: "Plugin Commands",
    project: "Project Commands",
  };

  for (const [source, cmds] of Object.entries(grouped)) {
    if (cmds.length === 0) continue;

    console.log(`  ${colors.bold(colors.white(groupLabels[source]))}`);
    console.log();

    // Find max name length for alignment
    const maxLen = Math.max(...cmds.map((c) => c.name.length + (c.alias ? c.alias.length + 4 : 0)));

    cmds.forEach((cmd) => {
      const aliasStr = cmd.alias ? colors.dim(` (${cmd.alias})`) : "";
      const nameWithAlias = cmd.name + (cmd.alias ? ` (${cmd.alias})` : "");
      const padding = " ".repeat(maxLen - nameWithAlias.length + 2);
      // const desc = cmd.description || colors.dim("No description");
      const desc = cmd.description || "";
      console.log(`    ${colors.cyan(cmd.name)}${aliasStr}${padding}${desc}`);
    });
    console.log();
  }

  // Display global flags
  console.log(`  ${colors.bold(colors.white("Global Flags"))}`);
  console.log();

  const globalFlags = [
    { flag: "--help, -h", description: "Show help for a command" },
    { flag: "--version, -v", description: "Show Warlock version" },
    { flag: "--no-cache", description: "Force reload without cache" },
    { flag: "--warm-cache", description: "Pre-cache all project commands" },
  ];

  const maxFlagLen = Math.max(...globalFlags.map((f) => f.flag.length));

  globalFlags.forEach(({ flag, description }) => {
    const padding = " ".repeat(maxFlagLen - flag.length + 2);
    console.log(`    ${colors.yellow(flag)}${padding}${description}`);
  });
  console.log();

  console.log(
    `  ${colors.dim("Run")} ${colors.cyan("warlock <command> --help")} ${colors.dim("for command-specific help")}`,
  );
  console.log();
}

/**
 * Display help for a specific command
 */
export function displayCommandHelp(command: {
  name: string;
  alias?: string;
  description?: string;
  options?: { name: string; text: string; description?: string; required?: boolean }[];
}) {
  console.log();
  console.log(
    `  ${colors.bold(colors.cyan(command.name))}${command.alias ? colors.dim(` (${command.alias})`) : ""}`,
  );

  if (command.description) {
    console.log(`  ${command.description}`);
  }
  console.log();

  if (command.options && command.options.length > 0) {
    console.log(`  ${colors.bold("Options:")}`);
    console.log();

    const maxLen = Math.max(...command.options.map((o) => o.text.length));

    command.options.forEach((opt) => {
      const padding = " ".repeat(maxLen - opt.text.length + 2);
      const required = opt.required ? colors.red(" (required)") : "";
      const desc = opt.description || "";
      console.log(`    ${colors.green(opt.text)}${padding}${desc}${required}`);
    });
    console.log();
  } else {
    console.log(`  ${colors.dim("No options available")}`);
    console.log();
  }
}
