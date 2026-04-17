import { type DataSource } from "@warlock.js/cascade";
import { type FastifyInstance } from "fastify";
import { type Server } from "socket.io";
import { type Router } from "../router";

const containerMap: Map<string, any> = new Map();

/**
 * Known container types for better IDE support
 */
export type ContainerTypes = {
  router: Router;
  "http.server": FastifyInstance;
  "http.baseUrl": string;
  socket: Server;
  "database.source": DataSource;
};

type ContainerKeys = keyof ContainerTypes | (string & {});

class Container {
  /**
   * Set a value in the container
   */
  public set<K extends keyof ContainerTypes>(key: K, value: ContainerTypes[K]): void;
  public set<T = any>(key: string, value: T): void;
  public set(key: any, value: any) {
    containerMap.set(key, value);
  }

  /**
   * Get a value from the container
   */
  public get<K extends keyof ContainerTypes>(key: K): ContainerTypes[K];
  public get<T = any>(key: string): T;
  public get(key: any): any {
    return containerMap.get(key);
  }

  /**
   * Check if a key exists in the container
   */
  public has(key: ContainerKeys) {
    return containerMap.has(key);
  }

  /**
   * Delete a key from the container
   */
  public delete(key: string) {
    containerMap.delete(key);
  }
}

export const container = new Container();
