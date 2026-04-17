export interface Generator {
  name: string;
  description: string;
  generate(options: GeneratorOptions): Promise<void>;
}

export interface GeneratorOptions {
  /**
   * The name of the component to generate
   * For module: "users"
   * For controller: "create-user"
   */
  name: string;

  /**
   * The module name (for non-module generators)
   * Example: "users", "posts"
   */
  module?: string;

  /**
   * Flags passed from CLI
   */
  flags: Record<string, boolean>;

  /**
   * Raw arguments from CLI
   */
  args: string[];
}

export interface ParsedName {
  /**
   * Original input
   */
  raw: string;

  /**
   * PascalCase: CreateUser
   */
  pascal: string;

  /**
   * camelCase: createUser
   */
  camel: string;

  /**
   * kebab-case: create-user
   */
  kebab: string;

  /**
   * snake_case: create_user
   */
  snake: string;

  /**
   * Module name (if applicable)
   */
  module?: string;
}
