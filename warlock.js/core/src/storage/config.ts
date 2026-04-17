import { S3ClientConfig } from "@aws-sdk/client-s3";
import { config } from "../config";
import type {
  CloudStorageDriverOptions,
  LocalStorageDriverOptions,
  R2StorageDriverOptions,
  StorageConfigurations,
  StorageDriverConfig,
} from "./types";

/**
 * Get storage configuration
 */
export function storageConfig(): StorageConfigurations;
export function storageConfig<T = any>(key: string): T;
export function storageConfig<T = any>(key: string, defaultValue: T): T;
export function storageConfig(key?: string, defaultValue?: any): any {
  if (!key) {
    return config.get("storage");
  }

  return config.get(`storage.${key}`, defaultValue);
}

export const storageConfigurations = {
  local: (options: LocalStorageDriverOptions): StorageDriverConfig => {
    return {
      driver: "local",
      ...options,
    };
  },
  aws: (options: CloudStorageDriverOptions & S3ClientConfig): StorageDriverConfig => {
    return {
      driver: "s3",
      ...options,
    };
  },
  r2: (options: R2StorageDriverOptions & S3ClientConfig): StorageDriverConfig => {
    return {
      driver: "r2",
      ...options,
    };
  },
  spaces: (options: CloudStorageDriverOptions & S3ClientConfig): StorageDriverConfig => {
    return {
      driver: "spaces",
      ...options,
    };
  },
};
