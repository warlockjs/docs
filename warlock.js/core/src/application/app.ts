import { container } from "./../container";

export const app = {
  get socket() {
    return container.get("socket");
  },
  get http() {
    return container.get("http.server");
  },
  get router() {
    return container.get("router");
  },
  get database() {
    return container.get("database.source");
  },
};
