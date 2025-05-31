import { type GenericObject } from "@mongez/reinforcements";
import { type Route } from "@warlock.js/core";

export type PostmanInput = {
  key: string;
  type: "text" | "file" | "number" | "boolean" | "array" | "object";
  description?: string;
  value?: any;
};

export type PostmanNode = PostmanCategoryType | PostmanRequestType;

export type PostmanCategoryType = {
  name: string;
  description?: string;
  item: PostmanNode[];
};

interface PostmanFolder {
  name: string;
  item: (PostmanFolder | PostmanRequestType)[];
}

export interface PostmanOutput {
  info: GenericObject;
  item: (PostmanFolder | PostmanRequestType)[];
  variable: PostmanVariable[];
}

export type MethodType =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

export type PostmanBodyType = {
  mode: "urlencoded" | "raw" | "formdata" | "file";
  raw: string;
  options?: GenericObject;
};

export type PostmanQueryType = {
  key: string;
  value: string;
};

export type PostmanRequestUrl = {
  raw: string;
  host?: string[];
  protocol?: string;
  path?: string[];
  query?: PostmanInput[];
};

export type PostmanRequestHeader = {
  key: string;
  value: string;
};

export type PostmanInternalRequestType = {
  method: MethodType;
  header: PostmanRequestHeader[];
  body?: GenericObject;
  url: PostmanRequestUrl;
};

export type PostmanRequestType = {
  name: string;
  // path: string;
  request: PostmanInternalRequestType;
  response?: GenericObject[];

  // description?: string;
  // method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  // headers?: GenericObject;
  // body?: GenericObject;
  // query?: GenericObject;
  // response?: GenericObject;
};

export type PostmanConfigurations = {
  /**
   * Base url
   */
  baseUrl?: string;
  /**
   * Collection name
   */
  collectionName?: string;
  /**
   * Description
   */
  description?: string;
  /**
   * Variables
   */
  variables?: {
    [key: string]: string;
  };
};

export interface PostmanVariable {
  id?: string;
  key: string;
  value: string;
  type?: "string" | "number" | "boolean";
}

export type PostmanResponse = GenericObject;

export type PostmanRequestEvent = {
  route: Route;
} & PostmanRequest;

export type PostmanRequest = {
  request: PostmanInternalRequestType;
  response?: PostmanResponse[];
  name: string;
};

declare module "@warlock.js/core" {
  export interface RouteHandlers {
    /**
     * Route configurations
     * Used only when generating postman
     */
    postman?: {
      /**
       * Define examples for the response
       */
      examples?: PostmanExample[];
    };
  }
  export interface Middlewares {
    /**
     * Postman configurations
     * Used only when generating postman
     */
    postman?: {
      /**
       * Called when collecting variables
       */
      onCollectingVariables?: (variables: PostmanVariable[]) => void;
      /**
       * Called when adding the request to the collection
       */
      onAddingRequest?: (postmanRequest: PostmanRequestEvent) => void;
    };
  }
}

export type PostmanExample = {
  description: string;
  request: {
    body?: GenericObject;
    query?: GenericObject;
    headers?: GenericObject;
  };
  response: {
    status: number;
    body?: GenericObject;
    headers?: GenericObject;
  };
};
