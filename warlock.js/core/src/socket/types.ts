import { ServerOptions } from "node:http";

/**
 * Socket options
 */
export type SocketOptions = {
  /**
   * Http Port, use it if the http is not enabled in the project
   */
  port?: number;
  /**
   * Socket.IO options
   */
  options?: ServerOptions;
};
