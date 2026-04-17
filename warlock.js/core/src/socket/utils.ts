import { type Server } from "socket.io";
import { container } from "../container";

/**
 * Get socket server instance
 */
export function getSocketServer(): Server | null {
  if (container.has("socket")) {
    return container.get("socket");
  }

  return null;
}
