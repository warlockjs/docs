import type { ReactElement, ReactNode } from "react";
import type { Request } from "../http/request";
import type { Response } from "../http/response";

export type PageHandlerOptions = {
  request: Request;
  response: Response;
  output: ReactNode;
};

export type PageHandler = (
  request: Request,
  response: Response,
) => Promise<ReactElement>;

export interface PageProps<T = any> {
  data?: T;
  url: string;
}

export interface PageComponent<T = any> {
  (props: PageProps<T>): JSX.Element;
  loader?: (request: Request, response: Response) => Promise<T>;
}

export interface ReactRouteHandler {
  component: PageComponent;
  ssr?: boolean;
}
