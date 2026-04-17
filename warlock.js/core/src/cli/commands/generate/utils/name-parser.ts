import { toCamelCase, toKebabCase, toSnakeCase, toStudlyCase } from "@mongez/reinforcements";
import pluralize from "pluralize-esm";
import type { ParsedName } from "../types";

/**
 * Parse module path from input
 * Examples:
 * - "users/create-user" → { module: "users", name: "create-user" }
 * - "create-user" → { module: undefined, name: "create-user" }
 */
export function parseModulePath(input: string): { module?: string; name: string } {
  const parts = input.split("/");

  if (parts.length === 1) {
    return { name: parts[0] };
  }

  return {
    module: parts[0],
    name: parts.slice(1).join("/"),
  };
}

/**
 * Parse name into all case variants
 */
export function parseName(input: string): ParsedName {
  return new Name(input);
}

/**
 * Get plural name
 */
export function pluralName(name: string) {
  return new Name(pluralize(name));
}

/**
 * Get singular name
 */
export function singularName(name: string) {
  return new Name(pluralize.singular(name));
}

export class Name {
  protected parsedData: {
    kebab: string;
    camel: string;
    snake: string;
    studly: string;
  };

  public constructor(public readonly raw: string) {
    this.parsedData = {
      kebab: toKebabCase(raw),
      camel: toCamelCase(raw),
      snake: toSnakeCase(raw),
      studly: toStudlyCase(raw),
    };
  }

  public get plural() {
    return new Name(pluralize(this.raw));
  }

  public get singular() {
    return new Name(pluralize.singular(this.raw));
  }

  public get pascal(): string {
    return this.parsedData.studly;
  }

  public get camel(): string {
    return this.parsedData.camel;
  }

  public get kebab(): string {
    return this.parsedData.kebab;
  }

  public get snake(): string {
    return this.parsedData.snake;
  }
}
