import { cache } from "@warlock.js/cache";
import { logger } from "@warlock.js/logger";
import { config } from "../config";
import { RegisteredUseCase, UseCase, UseCaseConfigurations, UseCaseResult } from "./types";

/**
 * Store registered use cases
 */
const useCaseRegister = new Map<string, RegisteredUseCase>();

/**
 * Register a use case
 */
export function $registerUseCase<Output, Input>(
  name: string,
  useCase: RegisteredUseCase<Output, Input>,
) {
  if (useCaseRegister.has(name) && process.env.NODE_ENV !== "production") {
    logger.warn(
      "use-cases",
      "registering",
      `Use case "${name}" is already registered. Overwriting.`,
    );
  }

  useCaseRegister.set(name, useCase);
}

/**
 * Unregister a use case
 */
export function $unregisterUseCase(name: string) {
  useCaseRegister.delete(name);

  cache.removeNamespace(`use-case:history:${name}`);
}

/**
 * Get a use case
 */
export function getUseCase<Output, Input>(name: string) {
  return useCaseRegister.get(name) as UseCase<Output, Input> | undefined;
}

/**
 * Get all use cases
 */
export function getUseCases() {
  return useCaseRegister;
}

/**
 * Increase use case calls
 */
export function increaseUseCaseCalls(name: string) {
  const useCase = useCaseRegister.get(name);
  if (useCase) {
    useCase.calls.total++;
  }
}

/**
 * Increase use case success calls
 */
export function increaseUseCaseSuccessCalls(name: string): number {
  const useCase = useCaseRegister.get(name);
  if (useCase) {
    useCase.calls.success++;
    useCase.calls.total++;

    return useCase.calls.success;
  }

  return 0;
}

/**
 * Increase use case failed calls
 */
export function increaseUseCaseFailedCalls(name: string): number {
  const useCase = useCaseRegister.get(name);
  if (useCase) {
    useCase.calls.failed++;
    useCase.calls.total++;

    return useCase.calls.failed;
  }

  return 0;
}

/**
 * Get use case history from cache
 */
export async function getUseCaseHistory(name: string): Promise<UseCaseResult<any>[]> {
  const listKey = `use-case:history:${name}:list`;
  const ids = (await cache.get<string[]>(listKey)) || [];

  const results = await Promise.all(
    ids.map((id: string) => cache.get<UseCaseResult<any>>(`use-case:history:${name}:${id}`)),
  );

  return results.filter(Boolean) as UseCaseResult<any>[];
}

/**
 * Add use case history to cache
 */
export async function addUseCaseHistory(name: string, result: UseCaseResult<any>) {
  const useCaseConfig = config.get<UseCaseConfigurations>("use-cases");

  if (useCaseConfig?.history?.enabled === false) return;

  const ttlConfig = useCaseConfig?.history?.ttl ?? 3600; // 1 hour default
  const ttl = ttlConfig === false ? undefined : ttlConfig;
  const key = `use-case:history:${name}:${result.id}`;
  const listKey = `use-case:history:${name}:list`;

  // Store individual result
  await cache.set(key, result, ttl);

  // Update list (append ID)
  const list = (await cache.get<string[]>(listKey)) || [];

  list.push(result.id);

  await cache.set(listKey, list, ttl);
}
