export class HttpError extends Error {
  public constructor(
    public status: number,
    public message: string,
    public payload?: any,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
export class ResourceNotFoundError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(404, message, payload);
    this.name = "ResourceNotFoundError";
  }
}

export class UnAuthorizedError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(401, message, payload);
    this.name = "UnAuthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(403, message, payload);
    this.name = "ForbiddenError";
  }
}

export class BadRequestError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(400, message, payload);
    this.name = "BadRequestError";
  }
}

export class ServerError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(500, message, payload);
    this.name = "ServerError";
  }
}

export class ConflictError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(409, message, payload);
    this.name = "ConflictError";
  }
}

export class NotAcceptableError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(406, message, payload);
    this.name = "NotAcceptableError";
  }
}

export class NotAllowedError extends HttpError {
  public constructor(
    message: string,
    public payload?: any,
  ) {
    super(405, message, payload);
    this.name = "NotAllowedError";
  }
}
