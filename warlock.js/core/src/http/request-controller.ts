import type { RequestControllerContract } from "./../router/types";
import type { Request } from "./request";
import type { Response } from "./response";
import type { ReturnedResponse } from "./types";

export abstract class RequestController implements RequestControllerContract {
  public constructor(
    public readonly request: Request,
    public readonly response: Response,
  ) {
    //
  }

  public abstract execute(): Promise<ReturnedResponse>;
}
