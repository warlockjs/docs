import type { SchemaContext } from "./context-types";

/**
 * Mutator context
 */
export type MutatorContext<Options = any> = {
  /** Mutator options */
  options: Options;
  /** Global validation context */
  ctx: SchemaContext;
};

/**
 * Mutator function - transforms data before validation
 */
export type Mutator<Options = any> = (data: any, context?: MutatorContext<Options>) => Promise<any>;

/**
 * Contextualized mutator - mutator with runtime context
 */
export type ContextualizedMutator<Options = any> = {
  /** Mutation function */
  mutate: Mutator<Options>;
  /** Mutator context */
  context: {
    options: Options;
    ctx: SchemaContext;
  };
};
