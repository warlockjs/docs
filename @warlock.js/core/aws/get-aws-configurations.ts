import type { AWSConnectionOptions } from ".";
import { config } from "../config";

export async function getAWSConfigurations(): Promise<
  AWSConnectionOptions | undefined
> {
  const awsConfigurations = config("uploads.aws.connectionOptions");

  if (!awsConfigurations) return;

  return typeof awsConfigurations === "function"
    ? await awsConfigurations()
    : awsConfigurations;
}

export async function getAWSConfig(key: keyof AWSConnectionOptions) {
  const configurations = await getAWSConfigurations();

  if (!configurations) return;

  return configurations[key];
}
