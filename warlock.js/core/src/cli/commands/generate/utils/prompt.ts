import readline from "node:readline";

/**
 * Prompt user for confirmation
 */
export async function confirm(message: string, defaultValue = false): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const defaultText = defaultValue ? "Y/n" : "y/N";
    rl.question(`${message} (${defaultText}): `, (answer) => {
      rl.close();

      if (!answer.trim()) {
        resolve(defaultValue);
        return;
      }

      const normalized = answer.toLowerCase().trim();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

/**
 * Prompt user for text input
 */
export async function input(message: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const prompt = defaultValue ? `${message} (${defaultValue}): ` : `${message}: `;

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Prompt user to select from choices
 */
export async function select(message: string, choices: string[]): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(message);
    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}. ${choice}`);
    });

    rl.question("Select (1-" + choices.length + "): ", (answer) => {
      rl.close();

      const index = parseInt(answer.trim(), 10) - 1;

      if (index >= 0 && index < choices.length) {
        resolve(choices[index]);
      } else {
        resolve(choices[0]);
      }
    });
  });
}
