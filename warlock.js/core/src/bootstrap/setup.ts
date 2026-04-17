import { colors } from "@mongez/copper";
import { environment } from "../utils";

export function displayEnvironmentMode() {
  const env = environment();

  const envColor = (env: string) => {
    switch (env) {
      case "development":
        return colors.yellow(env);
      case "production":
        return colors.green(env);
      case "test":
        return colors.magentaBright(env);
    }
  };

  console.log(
    colors.blueBright("ℹ"),
    colors.yellow(`(${new Date().toISOString()})`),
    colors.orange("[warlock]"),
    colors.magenta(`bootstrap`),
    colors.blueBright(`Starting application in ${envColor(env)} mode`),
  );
}
