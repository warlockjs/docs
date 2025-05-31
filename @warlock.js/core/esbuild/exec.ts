import { spawnSync } from "child_process";

export async function exec(filePath: string) {
  // Start a new server process.
  console.log("Executing file", filePath);
  spawnSync("node", [filePath], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}
