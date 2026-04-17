import type { SchemaContext } from "./context-types";

/**
 * Transformer callback signature
 * First param: the data to transform
 * Second param: object with options and context
 */
export type TransformerCallback = (
  data: any,
  params: {
    options: any;
    context: SchemaContext;
  },
) => any | Promise<any>;

/**
 * Simple transformer callback for outputAs()
 * First param: the data to transform
 * Second param: validation context
 */
export type SimpleTransformerCallback = (
  data: any,
  context: SchemaContext,
) => any | Promise<any>;

/**
 * Contextualized transformer - internal storage
 * Context is NOT stored, it's passed at runtime during validation
 */
export type ContextualizedTransformer = {
  transform: TransformerCallback;
  options: any;
};
