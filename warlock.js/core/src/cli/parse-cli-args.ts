import { toCamelCase } from "@mongez/reinforcements";

export type ParsedCliArgs = {
  name: string;
  args: string[];
  options: Record<string, string | boolean>;
};

/**
 * Parse CLI arguments from process.argv
 *
 * @example
 * parseCliArgs(["node", "warlock", "migrate", "--rollback", "file.ts"])
 * // Returns: { command: "migrate", args: ["file.ts"], options: { rollback: true } }
 *
 * @example
 * parseCliArgs(["node", "warlock", "dev", "--port=3000", "--fresh"])
 * // Returns: { command: "dev", args: [], options: { port: "3000", fresh: true } }
 */
export function parseCliArgs(argv: string[]): ParsedCliArgs {
  // Command is at index 2 (after "node" and script path)
  // But if index 2 starts with "-", it's an option, not a command
  const potentialCommand = argv[2] || "";
  const isFirstArgOption = potentialCommand.startsWith("-");
  const command = isFirstArgOption ? "" : potentialCommand;
  const args: string[] = [];
  const options: Record<string, string | boolean> = {};

  // Parse arguments starting from index 3 (or 2 if first arg was an option)
  const startIndex = isFirstArgOption ? 2 : 3;
  for (let i = startIndex; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      // Long option: --key or --key=value
      const withoutDashes = arg.slice(2);
      const equalIndex = withoutDashes.indexOf("=");

      if (equalIndex !== -1) {
        // --key=value format
        const key = toCamelCase(withoutDashes.slice(0, equalIndex));
        const value = withoutDashes.slice(equalIndex + 1);
        options[key] = value;
      } else {
        // --key format (check if next arg is a value)
        const key = toCamelCase(withoutDashes);
        const nextArg = argv[i + 1];

        // If next arg exists and doesn't start with -, treat it as value
        if (nextArg && !nextArg.startsWith("-")) {
          options[key] = nextArg;
          i++; // Skip next arg
        } else {
          options[key] = true;
        }
      }
    } else if (arg.startsWith("-") && arg.length > 1) {
      // Short option: -f, -t=value, or -abc (multiple flags)
      const flags = arg.slice(1);
      const equalIndex = flags.indexOf("=");

      if (equalIndex !== -1) {
        // -t=value format
        const key = toCamelCase(flags.slice(0, equalIndex));
        const value = flags.slice(equalIndex + 1);
        options[key] = value;
      } else if (flags.length === 1) {
        // Single flag: -f
        const nextArg = argv[i + 1];

        if (nextArg && !nextArg.startsWith("-")) {
          options[toCamelCase(flags)] = nextArg;
          i++; // Skip next arg
        } else {
          options[toCamelCase(flags)] = true;
        }
      } else {
        // Multiple flags: -abc becomes { a: true, b: true, c: true }
        for (const flag of flags) {
          options[toCamelCase(flag)] = true;
        }
      }
    } else {
      // Positional argument
      args.push(arg);
    }
  }

  return { name: command, args, options };
}
